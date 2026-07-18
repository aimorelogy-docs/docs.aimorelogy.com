---
id: yolov5
slug: /products/ovis/secondary-development/custom-ai-model-deployment/yolov5
title: YOLOv5
description: 将自定义 YOLOv5 模型转换为可部署到 Ovis 的 INT8 BModel。
---

# YOLOv5

本文介绍如何将自定义 YOLOv5 PyTorch 模型转换为可在 Ovis 的 CV184x 处理器上运行的 INT8 BModel。整体流程如下：

1. 使用 Ovis SDK 提供的导出工具，将 PyTorch 模型导出为 ONNX。
2. 将 ONNX 模型转换为 MLIR。
3. 生成 INT8 校准表。
4. 将 MLIR 模型编译为适用于 CV184x 的 BModel。

本文以输入尺寸为 `384 x 640` 的 YOLOv5n 模型为例。请根据实际模型调整权重路径、输入尺寸、测试图片和校准数据集，并确保整个转换流程中的相关参数保持一致。

## 将 PyTorch 模型导出为 ONNX

`yolov5_export.py` 依赖 PyTorch 以及 Ultralytics YOLOv5 所需的 Python 软件包。请在训练该模型时使用的环境中执行本节命令，也可以使用另一个已安装相同 YOLOv5 依赖的 Python 环境。下一节介绍的 Ovis TPU Docker 镜像用于模型转换与量化，不作为 YOLOv5 训练环境使用。

在开发主机上克隆 YOLOv5 仓库和 Ovis SDK。如果训练工作区中已有这些仓库，请直接使用现有副本：

```bash
cd ~/projects
git clone https://github.com/ultralytics/yolov5.git
git clone -b ovis-master https://github.com/aimorelogy-ovis/aimorelogy-ovis-sdk.git
```

YOLOv5 的标准 ONNX 导出方式会保留不适合量化的解码操作，因此需要使用 Ovis SDK [YOLO 导出工具](https://github.com/aimorelogy-ovis/aimorelogy-ovis-sdk/tree/ovis-master/tdl_sdk/tool/yolo_export)中的 `yolov5_export.py`。将该脚本复制到 YOLOv5 仓库：

```bash
cp ~/projects/aimorelogy-ovis-sdk/tdl_sdk/tool/yolo_export/yolov5_export.py \
  ~/projects/yolov5/
cd ~/projects/yolov5
```

将训练得到的权重放到 `weights/best.pt`，然后以 `384 x 640` 输入尺寸导出模型：

```bash
python yolov5_export.py \
  --weights ./weights/best.pt \
  --img-size 384 640
```

该命令会在当前目录生成 `best.onnx`。继续操作前，请将其复制或移动到模型转换工作目录。后续示例在主机上使用 `~/projects/yolov5-export`，将该目录挂载到容器后，其对应路径为 `/workspace/yolov5-export`。同时请将测试图片放到 `~/projects/yolov5-export/test.jpg`。

```bash
mkdir -p ~/projects/yolov5-export
cp best.onnx ~/projects/yolov5-export/
```

> **说明：** 如果模型使用其他输入尺寸，请确保此处的 `--img-size` 与下一节中的 `--input_shapes` 使用相同的高度和宽度。

## 准备模型转换环境

请先在开发主机上安装 [Docker](https://docs.docker.com/engine/install/)。AIMORELOGY 提供的 [Ovis TPU Docker 镜像](https://hub.docker.com/repository/docker/aimorelogy/ovis-tpu-docker)已内置后续步骤所需的 ONNX 到 MLIR 转换、校准和 BModel 编译工具。

拉取最新镜像：

```bash
docker pull aimorelogy/ovis-tpu-docker:latest
```

以下命令将主机的 `~/projects` 目录挂载到容器内的 `/workspace`，并将 `/workspace` 设置为工作目录。请将测试图片和校准数据集放在 `~/projects/yolov5-export` 下，或根据实际存放位置修改目录挂载参数。

```bash
docker run -it --rm --privileged -v /dev:/dev -v ~/projects:/workspace -w /workspace aimorelogy/ovis-tpu-docker:latest /bin/bash
```

`--rm` 会在退出后自动删除容器，`/workspace` 下的文件则通过目录挂载保留在主机上。容器启动后，进入模型转换工作目录：

```bash
cd /workspace/yolov5-export
```

后续命令均在该容器内执行。

## 将 ONNX 转换为 MLIR

YOLOv5 的图片输入采用 RGB 通道顺序。本示例不进行均值减法，并将每个通道乘以 `1 / 255`：

- 均值：`0.0, 0.0, 0.0`
- 缩放系数：`0.0039216, 0.0039216, 0.0039216`

执行以下命令，将 ONNX 模型转换为 MLIR：

```bash
model_transform.py \
  --model_name yolov5n \
  --model_def best.onnx \
  --input_shapes '[[1,3,384,640]]' \
  --mean 0.0,0.0,0.0 \
  --scale 0.0039216,0.0039216,0.0039216 \
  --keep_aspect_ratio \
  --pixel_format rgb \
  --test_input ./test.jpg \
  --test_result yolov5n_top_outputs.npz \
  --mlir yolov5n_384_640.mlir
```

命令成功后，当前目录会生成 `yolov5n_384_640.mlir`、参考输出 `yolov5n_top_outputs.npz` 和预处理后的输入 `yolov5n_in_f32.npz`。编译 BModel 时将使用这两个 NPZ 文件校验转换结果。

## 将 MLIR 转换为 INT8 BModel

### 生成校准表

INT8 量化需要使用具有代表性的图片数据集。建议准备约 100 至 1,000 张图片，并确保其数据分布与训练和实际部署场景接近。以下示例使用 `/workspace/yolov5-export/sensing_dir/images` 下的 100 张图片：

```bash
run_calibration.py yolov5n_384_640.mlir \
  --dataset /workspace/yolov5-export/sensing_dir/images \
  --input_num 100 \
  -o yolov5n_cali_table
```

该命令会生成 `yolov5n_cali_table`。如果有效图片不足 100 张，请补充具有代表性的图片，或将 `--input_num` 调整为数据集的实际数量。

### 生成 BModel

使用 INT8 对称量化，将 MLIR 模型编译为适用于 CV184x 的 BModel：

```bash
model_deploy.py \
  --mlir yolov5n_384_640.mlir \
  --quant_input \
  --quant_output \
  --quantize INT8 \
  --calibration_table yolov5n_cali_table \
  --processor cv184x \
  --test_input yolov5n_in_f32.npz \
  --test_reference yolov5n_top_outputs.npz \
  --tolerance 0.85,0.45 \
  --model yolov5n_cv184x_int8.bmodel
```

`--quant_input` 和 `--quant_output` 分别将模型输入与输出量化为 INT8。`--test_input` 和 `--test_reference` 使用指定的容差，将编译后的模型与 MLIR 转换结果进行对比。

编译成功后，确认 BModel 已生成：

```bash
ls -lh yolov5n_cv184x_int8.bmodel
```

生成的 `yolov5n_cv184x_int8.bmodel` 即为适用于 CV184x Ovis 设备的模型文件。为其他处理器编译的 BModel 不能直接混用，请始终确保 `--processor` 参数与目标设备一致。

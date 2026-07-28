---
id: yolov8n
slug: /products/ovis/secondary-development/custom-ai-model-deployment/yolov8n
title: YOLOv8n
description: 将自定义 YOLOv8n 模型转换为 INT8 BModel，并通过 OVIS Web 完成部署。
---

# YOLOv8n

本文介绍如何将自定义 YOLOv8n PyTorch 模型转换为适用于 CV184x 的 INT8 BModel，再通过 OVIS Web 导入并启用模型。

示例使用固定的 `640 x 640` Tensor 尺寸。导出尺寸必须与 `--input_shapes` 保持一致。也可以使用其他固定尺寸，但模型和每一步转换命令都需要采用同一尺寸。

整个过程分为两部分：

1. 在开发电脑上导出并编译模型。
2. 在 OVIS Web 中上传、校验并启用 BModel。

## 开始前的准备

请准备以下内容：

- 训练完成的 YOLOv8n 权重，本文命名为 `best.pt`。
- 一张有代表性的测试图片 `test.jpg`。
- 来自实际相机和使用场景的校准图片集。
- Ovis SDK，其中包含 YOLOv8 专用导出脚本。
- 按训练索引排列的类别名称。

例如数据集将 `person` 定义为类别 `0`、`helmet` 定义为类别 `1`，导入模型时也要按此顺序填写。

## 将 PyTorch 导出为 ONNX

请在训练模型所用的 Python 环境中完成本节，也可以使用依赖版本一致的 Ultralytics 环境。

如果本地还没有源码，请克隆 Ultralytics 和 Ovis SDK：

```bash
cd ~/projects
git clone https://github.com/ultralytics/ultralytics.git
git clone -b ovis-master https://github.com/aimorelogy-ovis/aimorelogy-ovis-sdk.git
```

安装 Ultralytics，再将 Ovis 的导出脚本复制到仓库中：

```bash
cd ~/projects/ultralytics
pip install -e .
cp ~/projects/aimorelogy-ovis-sdk/tdl_sdk/tool/yolo_export/yolov8_export.py .
```

将 `best.pt` 放在当前目录，导出固定尺寸的 ONNX 模型：

```bash
python yolov8_export.py \
  --weights ./best.pt \
  --img-size 640 640
```

Ovis 脚本会调整 YOLOv8 检测头，输出六个未经解码的分支。设备端 YOLOv8 后处理按这组输出工作，请勿换成包含解码或 NMS 的导出方式。

命令结束时会打印 ONNX 文件的保存路径。后文假设文件名为 `best.onnx`。

创建转换工作目录：

```bash
mkdir -p ~/projects/yolov8n-export
cp ./best.onnx ~/projects/yolov8n-export/
cp /path/to/test.jpg ~/projects/yolov8n-export/test.jpg
```

## 准备模型转换环境

先在开发电脑上安装 [Docker](https://docs.docker.com/engine/install/)。[Ovis TPU Docker 镜像](https://hub.docker.com/repository/docker/aimorelogy/ovis-tpu-docker)中已经包含 ONNX 到 MLIR 转换工具、校准工具和 CV184x 编译器。

拉取并启动镜像：

```bash
docker pull aimorelogy/ovis-tpu-docker:latest

docker run -it --rm --privileged \
  -v /dev:/dev \
  -v ~/projects:/workspace \
  -w /workspace \
  aimorelogy/ovis-tpu-docker:latest \
  /bin/bash
```

容器退出后，`/workspace` 中的文件仍会保留在主机上。后续转换命令都在容器内执行：

```bash
cd /workspace/yolov8n-export
```

## 将 ONNX 转换为 MLIR

YOLOv8 使用 RGB 输入，并将像素值乘以 `1 / 255`。本示例不做均值减法：

- Mean：`0.0, 0.0, 0.0`
- Scale：`0.0039216, 0.0039216, 0.0039216`

执行转换：

```bash
model_transform.py \
  --model_name yolov8n \
  --model_def best.onnx \
  --input_shapes '[[1,3,640,640]]' \
  --mean 0.0,0.0,0.0 \
  --scale 0.0039216,0.0039216,0.0039216 \
  --keep_aspect_ratio \
  --pixel_format rgb \
  --test_input ./test.jpg \
  --test_result yolov8n_top_outputs.npz \
  --mlir yolov8n_640_640.mlir
```

命令会生成 `yolov8n_640_640.mlir`、`yolov8n_top_outputs.npz` 和 `yolov8n_in_f32.npz`。编译 BModel 时会使用两个 NPZ 文件作为参考数据。

## 编译 INT8 BModel

### 生成校准表

条件允许时，建议准备 100 至 1,000 张有代表性的图片。使用真实相机在实际光照、距离和目标分布下采集的图片，通常比通用数据集更适合量化校准。

```bash
run_calibration.py yolov8n_640_640.mlir \
  --dataset /workspace/yolov8n-export/sensing_dir/images \
  --input_num 100 \
  -o yolov8n_cali_table
```

如果有效图片不足 100 张，请补充样本，或将 `--input_num` 改为实际数量。

### 生成 BModel

使用 INT8 对称量化，为 CV184x 编译模型：

```bash
model_deploy.py \
  --mlir yolov8n_640_640.mlir \
  --quant_input \
  --quant_output \
  --quantize INT8 \
  --calibration_table yolov8n_cali_table \
  --processor cv184x \
  --test_input yolov8n_in_f32.npz \
  --test_reference yolov8n_top_outputs.npz \
  --tolerance 0.85,0.45 \
  --model yolov8n_cv184x_int8.bmodel
```

确认文件已经生成：

```bash
ls -lh yolov8n_cv184x_int8.bmodel
```

Ovis 只能使用通过 `--processor cv184x` 编译的 BModel。建议将 `best.pt`、`best.onnx`、校准表和转换日志与生成的模型一同归档，方便后续复现。

## 通过 OVIS Web 部署 BModel

这里不需要注册模型 ID，也不需要修改 `model_factory.json`、`param_config.ini`、固件资源或重新编译 Ovis SDK。OVIS Web 会把模型元数据和 BModel 上传到 Ovis Manager，由设备生成对应的模型配置。

### 连接 Ovis

1. 使用受支持的 Chromium 浏览器打开 [OVIS Web](https://ovis.aimorelogy.com)。
2. 搜索并连接 Ovis 设备。
3. 在配置页打开“模型管理”。

启用或停用模型前，请先保存或放弃配置页中的未保存修改。主配置存在草稿时，OVIS Web 会阻止模型启用和停用操作。

<!-- 请替换为设备已连接并打开“模型管理”区域的截图。 -->
![在 OVIS Web 中打开模型管理](/img/products/ovis/custom-ai-model-deployment/01-model-management-zh.webp)

### 导入模型

1. 点击“新增模型”。
2. 选择“目标检测”，再选择“YOLOv8”。
3. 填写便于识别的模型名称，例如 `helmet-detection-v1`。
4. 选择 `yolov8n_cv184x_int8.bmodel`。
5. 严格按照训练索引添加类别名称。
6. 开始上传，等待设备完成校验。

YOLOv8 在 OVIS Web 中不需要填写 Anchors。页面会从设备读取导入器、文件大小限制、元数据结构和类别数量约束。如果导入器列表中没有 YOLOv8，请先更新设备固件。

文件上传期间不要关闭页面。上传失败后可以重试，但会从文件开头重新发送整个 BModel。

<!-- 请替换为 YOLOv8 导入表单、类别列表和已选择 BModel 的截图。 -->
![导入 YOLOv8n BModel 并填写类别](/img/products/ovis/custom-ai-model-deployment/02-yolov8-import-zh-03.webp)
![导入 YOLOv8n BModel 并填写类别](/img/products/ovis/custom-ai-model-deployment/02-yolov8-import-zh-01.webp)
![导入 YOLOv8n BModel 并填写类别](/img/products/ovis/custom-ai-model-deployment/02-yolov8-import-zh-02.webp)

### 设置参数并启用模型

校验通过后：

1. 打开该模型的“部署配置”。
2. 设置置信度阈值。
3. 选择或填写设备允许的“AI 输入帧尺寸”。
4. 保存部署参数。
5. 点击“启用”。

BModel Tensor 尺寸为只读信息。AI 输入帧尺寸用于控制送入 AI 管线的画面，可以与模型转换时固定的 `640 x 640` Tensor 尺寸不同。OVIS Web 会按照设备返回的范围和预设进行校验。

启用模型会创建应用任务，AI 管线或管理连接可能短暂重启。请保持页面打开，OVIS Web 会按设备 ID 重新连接，并继续确认任务状态。此时出现短暂网络错误，不代表部署失败。

任务完成后，模型状态会显示为“运行中”，目标检测区域也会将该自定义模型显示为当前运行模型。

<!-- 请替换为部署参数及模型“运行中”状态的截图。 -->
![配置并启用自定义 YOLOv8n 模型](/img/products/ovis/custom-ai-model-deployment/03-deployment-activation-zh-01.webp)
![配置并启用自定义 YOLOv8n 模型](/img/products/ovis/custom-ai-model-deployment/03-deployment-activation-zh-02.webp)

## 更新或删除模型

- 在“部署配置”中修改阈值或 AI 输入帧尺寸。模型运行期间修改参数时，请点击“保存并应用”，并等待新任务完成。
- 删除运行中的模型前，需要先停用。
- 新版 BModel 需要作为一条新的模型记录导入，不能直接覆盖原文件。

## 常见问题

### “新增模型”中没有 YOLOv8

当前固件没有返回兼容的 `detection.yolov8` 导入器。请更新 Ovis Manager 和设备固件，再重新连接。

### 导入校验失败

打开导入任务，查看设备返回的校验错误，并逐项确认：

- 文件是完整的 CV184x BModel。
- ONNX 由 Ovis 提供的 `yolov8_export.py` 导出。
- 填写的类别数量与模型输出一致。
- 类别名称没有重复，并且顺序与训练索引一致。
- 文件没有超过 OVIS Web 显示的限制。

### 启用失败

OVIS Web 会显示设备返回的任务错误和回滚结果。请修正部署参数或 BModel，再重新启用。如果页面暂时与设备断开，请先等待 90 秒重连检查结束。

### INT8 模型检测精度下降

先检查校准图片是否覆盖实际使用的相机、光照、目标大小和工作场景。使用相同图片对比 PyTorch、ONNX、MLIR 和 BModel 输出，可以判断精度从哪个阶段开始变化。

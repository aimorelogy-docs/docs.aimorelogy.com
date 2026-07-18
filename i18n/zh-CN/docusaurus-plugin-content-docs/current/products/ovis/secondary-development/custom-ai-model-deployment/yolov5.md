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

## 将 BModel 集成到 Ovis SDK

生成 BModel 后，Ovis 应用并不会自动使用该模型。Ovis 固件通过 TDL SDK 的模型 ID 与模型工厂选择后处理算法，通过 `ipcamera` 配置选择具体 AI 任务，并通过资源安装规则将模型文件打包进固件。

以下步骤将模型接入现有的 `ipcamera` 行人检测流程。示例假设 Ovis SDK 位于 `/workspace/aimorelogy-ovis-sdk`，模型文件名为 `yolov5n_cv184x_int8.bmodel`。

### 确认模型约定

修改 SDK 前，请从训练配置中确认以下信息：

- 类别数量。
- 严格按照训练索引排列的类别名称。
- 按检测头顺序排列的 YOLOv5 Anchor。
- 模型输入高度和宽度。

后续配置的 `types` 数量与顺序必须和模型输出一致。例如，一个类别 ID 为 `0`、`1`、`2` 的三分类模型可以配置为：

```json
"types": ["person", "helmet", "vehicle"]
```

请勿按字母顺序重新排列，数组下标就是模型输出的类别 ID。

当前 YOLOv5 后处理会从分类输出张量读取类别数量。仍应将模型工厂中的类别数量与 `types` 条目数设置为相同值，确保模型注册信息内部一致。C API 返回的是数值形式的 `class_id`；当前 `ipcamera` 行人检测 OSD 只绘制检测框，不会显示 `types` 中的类别名称。如需在应用中显示名称，需要自行将 `class_id` 映射到 `types` 数组。

YOLOv5 后处理还在 `tdl_sdk/src/components/nn/object_detection/yolov5.cpp` 中保存了标准 Anchor。如果训练过程生成了不同的 Anchor，请按照相同的检测头顺序替换 `initial_anchors` 中的 18 个值。Anchor 不匹配时，模型可能输出正常置信度，但检测框位置或尺寸会出现错误。

### 在 TDL SDK 中注册模型

可以使用以下两种接入方式。如果固件中只使用一个私有 YOLOv5 模型，复用通用 ID 更简单；如果需要同时保留多个 YOLOv5 模型，或其他业务代码需要区分这些模型，建议新增专用 ID。

#### 方式 A：复用通用 YOLOv5 ID

模型列表中已经声明了 `YOLOV5`，并会自动生成 C API 使用的 `TDL_MODEL_YOLOV5`。但是，当前模型工厂尚未针对该通用 ID 创建 `YoloV5Detection` 实例。请在 `tdl_sdk/src/components/nn/factory/tdl_model_factory_internal.cpp` 的 `createObjectDetectionModel()` 中增加以下分支：

```cpp
} else if (model_type == ModelType::YOLOV5) {
  model_category = 4;  // YOLOV5
  num_classes = 3;     // 替换为实际类别数量。
```

`isObjectDetectionModel()` 已包含 `ModelType::YOLOV5`，因此复用通用 ID 时无需修改该函数。

然后修改 `tdl_sdk/configs/model/model_factory.json` 中 `model_list` 下的 `YOLOV5` 配置：

```json
"YOLOV5": {
  "types": ["person", "helmet", "vehicle"],
  "file_name": "yolov5n_cv184x_int8.bmodel"
}
```

请将示例中的三个类别名称和 `num_classes = 3` 替换为训练数据集的实际类别列表与数量。`ipcamera` 会使用明确的模型路径打开文件；填写 `file_name` 可以保持模型工厂元数据完整，也支持其他通过模型目录解析文件的调用方式。

#### 方式 B：新增专用模型 ID

如需使用独立名称，请在 `tdl_sdk/include/nn/tdl_model_list.h` 的 `MODEL_TYPE_LIST` 中新增条目。该文件中不要添加 `TDL_MODEL_` 前缀：

```cpp
X(YOLOV5N_DET_CUSTOM, "0:person,1:helmet,2:vehicle") \
```

该宏会自动生成 `ModelType::YOLOV5N_DET_CUSTOM` 和 C API 使用的 `TDL_MODEL_YOLOV5N_DET_CUSTOM`。

然后在 `tdl_model_factory_internal.cpp` 中完成两项修改：

1. 将 `ModelType::YOLOV5N_DET_CUSTOM` 加入 `isObjectDetectionModel()`。
2. 在 `createObjectDetectionModel()` 中增加对应的工厂分支：

```cpp
} else if (model_type == ModelType::YOLOV5N_DET_CUSTOM) {
  model_category = 4;  // YOLOV5
  num_classes = 3;
```

如果下游逻辑依赖具有业务含义的 `TDLObjectType`，还需要在该分支中为已支持的类别填写 `model_type_mapping`。没有对应 `TDLObjectType` 的类别仍可通过数值形式的 `class_id` 区分。

最后在 `model_factory.json` 中增加名称完全一致的配置：

```json
"YOLOV5N_DET_CUSTOM": {
  "types": ["person", "helmet", "vehicle"],
  "file_name": "yolov5n_cv184x_int8.bmodel"
}
```

JSON 的键必须与 `tdl_model_list.h` 中的名称完全一致。如果选择该方式，请在后续示例中使用此专用 ID 替代 `TDL_MODEL_YOLOV5`。

### 允许 `ipcamera` 选择 YOLOv5 模型

现有行人检测模块只接受 `TDL_MODEL_YOLOV8N_DET_MONITOR_PERSON`。无论使用 `TDL_MODEL_YOLOV5` 还是专用 ID，都需要扩展以下接入点。

在 `ipcamera/modules/common/paramparse/ai/src/app_ipcam_param_ai.c` 中，将 ID 添加到 `ai_supported_model`，使 INI 解析器能够转换其字符串形式：

```c
[TDL_MODEL_YOLOV5] = MODEL_NAME(TDL_MODEL_YOLOV5),
```

在 `ipcamera/modules/ai/pd/src/app_ipcam_ai_pd.c` 的 `app_ipcam_Ai_InferenceFunc_Get()` 中增加该 ID：

```c
case TDL_MODEL_YOLOV5:
    g_pfpPDInference = TDL_Detection;
    break;
```

行人检测模块当前会向模型工厂配置路径传入 `NULL`。请在 `ipcamera/modules/ai/include/app_ipcam_ai.h` 的 `APP_PARAM_AI_PD_CFG_S` 中增加 `model_path_cfg`：

```c
char model_path[MODEL_PATH_LEN];
char model_path_cfg[MODEL_PATH_LEN];
```

在 `ipcamera/modules/common/paramparse/ai_pd/src/app_ipcam_param_ai_pd.c` 中读取该配置项：

```c
ini_gets(tmp_section, "model_path_cfg", " ", tmp_buff, sizeof(tmp_buff), file);
app_ipcam_Param_CopyString(Ai->model_path_cfg,
    sizeof(Ai->model_path_cfg), tmp_buff);
```

最后在 `app_ipcam_ai_pd.c` 中将该路径传给 `TDL_OpenModel()`：

```c
s32Ret = TDL_OpenModel(g_PDAiHandle, g_pstPdCfg->model_id,
    g_pstPdCfg->model_path, g_pstPdCfg->model_path_cfg, 0);
```

模型工厂会先加载固件中的 `model_factory.json`，再创建 YOLOv5 后处理实例。

### 将 BModel 添加为 `ipcamera` 资源

将生成的模型复制到 SDK 资源目录：

```bash
cd /workspace/aimorelogy-ovis-sdk
cp /workspace/yolov5-export/yolov5n_cv184x_int8.bmodel \
  ipcamera/resource/ai_model/
```

在 `ipcamera/build/resource/Kconfig` 的 CV184X AI 模型菜单中增加资源选项：

```text
config RESOURCE_INSTALL_YOLOV5N_CUSTOM
	bool "install custom yolov5n model"
	default n
	help
		Install the custom YOLOv5n BModel.
```

在 Ovis 应用 defconfig `ipcamera/configs/cv184x_ovis_app_defconfig` 中启用该选项：

```text
CONFIG_RESOURCE_INSTALL_YOLOV5N_CUSTOM=y
```

在 `ipcamera/build/install.mk` 中增加对应的安装规则：

```make
ifeq ($(CONFIG_RESOURCE_INSTALL_YOLOV5N_CUSTOM),y)
	@mkdir -p $(APP_INSTALL_DIR)/cv184x/
	@cp -f $(APP_RESOURCE_DIR)/ai_model/yolov5n_cv184x_int8.bmodel \
		$(APP_INSTALL_DIR)/cv184x/
endif
```

当 `CONFIG_MODULE_AI=y` 时，同一个安装目标已经会将 TDL SDK 的 `tdl_sdk/install/CV184X/configs/model/model_factory.json` 复制为 `ipcamera/install/model_factory.json`。完整构建时需要保持 `TPU_REL=1`，确保修改后的 TDL SDK 及其 JSON 在安装 `ipcamera` 之前重新构建。

### 修改 Ovis INI 配置

修改源配置 `ipcamera/resource/parameter/sbm/cv1842hp_ovis_sc235hai.ini`。复用通用 ID 时，行人检测配置示例如下：

```ini
[ai_pd_config]
pd_enable        = 0
vpss_grp         = 2
vpss_chn         = 0
grp_width        = 640
grp_height       = 384
model_id         = TDL_MODEL_YOLOV5
model_path       = "/usr/share/ipcamera/cv184x/yolov5n_cv184x_int8.bmodel"
model_path_cfg   = "/usr/share/ipcamera/model_factory.json"
threshold        = 0.5
```

`grp_width` 和 `grp_height` 表示实际从 VPSS 通道取得的帧尺寸，OSD 也会使用这两个值缩放检测框。如果将其改为 `640 x 384`，必须同时将 `[vpssgrp2.chn0]` 下的 `width` 和 `height` 改为 `640` 和 `384`，不能只修改 AI 配置段。也可以保留现有的 `448 x 256` VPSS 帧，由 TDL 预处理缩放到模型输入尺寸，但两个 INI 配置段必须保持一致。

如果新增了专用 ID，请在 `model_id` 中使用该 ID。仅在需要开机自动启动行人检测时设置 `pd_enable = 1`；否则可以保持关闭，再通过 Ovis Manager 启用。

### 防止 Ovis Manager 恢复旧模型

设备实际使用的运行配置是 `/mnt/cfg/ipcamera/param_config.ini`，不是 `/usr/share/ipcamera` 下的副本。只有在运行配置不存在或无效时，Ovis Manager 才会使用固件中的默认配置创建它。

此外，`ovis-manager/backend/src/config_store.c` 当前会在 `migrate_runtime_config()` 中将 `ai_pd_config.model_path` 迁移为内置 YOLOv8 模型路径。请修改其中的 `ini_update` 条目，使其使用所选的 YOLOv5 模型 ID、模型路径和工厂配置路径：

```c
{ "ai_pd_config", "model_id", "TDL_MODEL_YOLOV5", 0 },
{ "ai_pd_config", "model_path",
  "\"/usr/share/ipcamera/cv184x/yolov5n_cv184x_int8.bmodel\"", 0 },
{ "ai_pd_config", "model_path_cfg",
  "\"/usr/share/ipcamera/model_factory.json\"", 0 },
```

同时调整迁移索引列表或相邻迁移逻辑，确保这三个条目都会被应用。否则已有设备可能继续保留旧模型 ID，或在启动时将自定义模型路径改回内置路径。

将新固件安装到已有运行配置的设备后，还需要在 `/mnt/cfg/ipcamera/param_config.ini` 中同步修改这三个值，或将 Ovis 配置恢复为新固件的默认值。操作前请备份原配置。仅修改 SDK 中的源 INI 不会覆盖 `/mnt/cfg` 下已经有效的配置文件。

### 编译并打包固件

使用 `ovis_spinand` 板级目标执行完整构建：

```bash
cd /workspace/aimorelogy-ovis-sdk
source build/envsetup_soc.sh
defconfig ovis_spinand
export TPU_REL=1
clean_all
build_all
```

对于该板级目标，`build_all` 会按照以下顺序完成相关操作：

1. `build_tdl_sdk` 重新构建修改后的模型工厂并暂存 `model_factory.json`。
2. `build_ipcamera` 固定加载 `cv184x_ovis_app_defconfig`，编译应用并执行安装目标。
3. 资源安装规则将 BModel 复制到 `ipcamera/install/cv184x/`。
4. 根文件系统准备阶段将 `ipcamera/install` 的全部内容复制到 `install/soc_ovis_spinand/rootfs/usr/share/ipcamera/`。
5. `pack_rootfs` 将该目录打包进 `rootfs.spinand`，`pack_upgrade` 再将镜像放入 `aimorelogy_ovis_firmware.zip`。

因此，BModel 实际打包在 `rootfs.spinand` 中，而不是板级配置中单独存在的 `system.spinand`。构建完成后检查暂存文件和最终固件：

```bash
test -f ipcamera/install/cv184x/yolov5n_cv184x_int8.bmodel
test -f ipcamera/install/model_factory.json
test -f install/soc_ovis_spinand/rootfs/usr/share/ipcamera/cv184x/yolov5n_cv184x_int8.bmodel
grep -A4 '"YOLOV5"' ipcamera/install/model_factory.json
ls -lh install/soc_ovis_spinand/rootfs.spinand
ls -lh install/soc_ovis_spinand/aimorelogy_ovis_firmware.zip
```

`ovis_spinand` 的根文件系统分区配置为 71,680 KiB。添加较大模型时需要检查镜像和分区占用；如需扩展分区，必须同步调整完整 Flash 布局，不能只修改生成的 XML。

固件烧录后，在设备上检查运行文件：

```bash
ls -lh /usr/share/ipcamera/cv184x/yolov5n_cv184x_int8.bmodel
grep -A4 '"YOLOV5"' /usr/share/ipcamera/model_factory.json
grep -A10 '^\[ai_pd_config\]' /mnt/cfg/ipcamera/param_config.ini
```

如果模型打开失败，请依次确认：所选模型 ID 是否进入 YOLOv5 工厂分支、类别数量与 Anchor 是否和训练配置一致、`model_path_cfg` 是否指向可读取的 JSON 文件，以及 BModel 是否使用 `--processor cv184x` 编译。

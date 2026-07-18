---
id: yolov5
slug: /products/ovis/secondary-development/custom-ai-model-deployment/yolov5
title: YOLOv5
description: Convert a custom YOLOv5 model to an INT8 BModel for deployment on Ovis.
---

# YOLOv5

This guide describes how to convert a custom YOLOv5 PyTorch model into an INT8 BModel that can run on the CV184x processor in Ovis. The workflow consists of the following steps:

1. Export the PyTorch model to ONNX with the export tool provided by the Ovis SDK.
2. Convert the ONNX model to MLIR.
3. Generate an INT8 calibration table.
4. Compile the MLIR model into a CV184x BModel.

The examples use a YOLOv5n model with an input size of `384 x 640`. Adjust the weight path, input size, test image, and calibration dataset for your model while keeping these values consistent throughout the conversion process.

## Export the PyTorch Model to ONNX

`yolov5_export.py` depends on PyTorch and the Python packages required by Ultralytics YOLOv5. Run this section in the environment used to train the model, or another Python environment with the same YOLOv5 dependencies installed. The Ovis TPU Docker image introduced in the next section is intended for model conversion and quantization; it is not the YOLOv5 training environment.

Clone the YOLOv5 repository and the Ovis SDK on the development host. If the repositories are already available in the training workspace, use the existing copies:

```bash
cd ~/projects
git clone https://github.com/ultralytics/yolov5.git
git clone -b ovis-master https://github.com/aimorelogy-ovis/aimorelogy-ovis-sdk.git
```

The standard YOLOv5 ONNX export retains decoding operations that are not suitable for quantization. Use `yolov5_export.py` from the Ovis SDK [YOLO export tools](https://github.com/aimorelogy-ovis/aimorelogy-ovis-sdk/tree/ovis-master/tdl_sdk/tool/yolo_export) instead. Copy the script into the YOLOv5 repository:

```bash
cp ~/projects/aimorelogy-ovis-sdk/tdl_sdk/tool/yolo_export/yolov5_export.py \
  ~/projects/yolov5/
cd ~/projects/yolov5
```

Place the trained weights at `weights/best.pt`, then export the model with a `384 x 640` input:

```bash
python yolov5_export.py \
  --weights ./weights/best.pt \
  --img-size 384 640
```

The command generates `best.onnx` in the current directory. Copy or move it to the model conversion workspace before continuing. The following examples use `~/projects/yolov5-export` on the host, which becomes `/workspace/yolov5-export` after the directory is mounted into the container. Also place the test image at `~/projects/yolov5-export/test.jpg`.

```bash
mkdir -p ~/projects/yolov5-export
cp best.onnx ~/projects/yolov5-export/
```

> **Note:** For a different model input size, update `--img-size` here and `--input_shapes` in the next section to the same height and width.

## Prepare the Model Conversion Environment

Install [Docker](https://docs.docker.com/engine/install/) on the development host. AIMORELOGY provides the [Ovis TPU Docker image](https://hub.docker.com/repository/docker/aimorelogy/ovis-tpu-docker), which includes the ONNX-to-MLIR conversion, calibration, and BModel compilation tools required by the remaining steps.

Pull the latest image:

```bash
docker pull aimorelogy/ovis-tpu-docker:latest
```

The following command mounts the host `~/projects` directory at `/workspace` in the container and uses `/workspace` as the working directory. Place the test image and calibration dataset under `~/projects/yolov5-export`, or change the volume mapping to match their actual location.

```bash
docker run -it --rm --privileged -v /dev:/dev -v ~/projects:/workspace -w /workspace aimorelogy/ovis-tpu-docker:latest /bin/bash
```

The `--rm` option removes the container after exit, while files under `/workspace` remain on the host through the bind mount. After the container starts, enter the model conversion workspace:

```bash
cd /workspace/yolov5-export
```

Run all subsequent commands inside this container.

## Convert ONNX to MLIR

YOLOv5 image input uses RGB channel order. This example scales each channel by `1 / 255` and does not apply mean subtraction:

- Mean: `0.0, 0.0, 0.0`
- Scale: `0.0039216, 0.0039216, 0.0039216`

Convert the ONNX model to MLIR:

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

After the command succeeds, the directory contains `yolov5n_384_640.mlir`, the reference output `yolov5n_top_outputs.npz`, and the preprocessed input `yolov5n_in_f32.npz`. These NPZ files are used to verify the result during BModel compilation.

## Convert MLIR to an INT8 BModel

### Generate the Calibration Table

INT8 quantization requires a representative image dataset. Prepare approximately 100 to 1,000 images whose distribution is close to the training and deployment data. The following example uses 100 images under `/workspace/yolov5-export/sensing_dir/images`:

```bash
run_calibration.py yolov5n_384_640.mlir \
  --dataset /workspace/yolov5-export/sensing_dir/images \
  --input_num 100 \
  -o yolov5n_cali_table
```

The command generates `yolov5n_cali_table`. If fewer than 100 valid images are available, either add more representative images or adjust `--input_num` to the actual dataset size.

### Generate the BModel

Compile the MLIR model for CV184x with symmetric INT8 quantization:

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

`--quant_input` and `--quant_output` quantize the model input and output to INT8. `--test_input` and `--test_reference` compare the compiled model against the MLIR conversion results using the specified tolerance.

After compilation succeeds, verify that the BModel was generated:

```bash
ls -lh yolov5n_cv184x_int8.bmodel
```

The resulting `yolov5n_cv184x_int8.bmodel` is the model artifact for CV184x-based Ovis devices. A BModel compiled for another processor cannot be used interchangeably; always keep the `--processor` value aligned with the target device.

## Integrate the BModel into the Ovis SDK

Generating the BModel does not make it available to the Ovis application automatically. The Ovis firmware uses TDL SDK model IDs and factory code to select the decoder, `ipcamera` configuration to select the workload, and resource installation rules to include model files in the firmware.

The following instructions integrate the model with the existing `ipcamera` pedestrian-detection pipeline. They assume the Ovis SDK is under `/workspace/aimorelogy-ovis-sdk` and use `yolov5n_cv184x_int8.bmodel` as the model filename.

### Check the Model Contract

Before changing the SDK, record the following values from the training configuration:

- Number of classes.
- Class names in exact training-index order.
- YOLOv5 anchors in detection-head order.
- Model input height and width.

The number and order of `types` configured later must match the model output. For example, a three-class model trained with class IDs `0`, `1`, and `2` might use:

```json
"types": ["person", "helmet", "vehicle"]
```

Do not alphabetize this list. The array index is the class ID produced by the model.

The current YOLOv5 decoder reads the class count from the class-output tensor. The factory class count and the number of entries in `types` should still be set to the same value so the model registration remains internally consistent. The C API returns numeric `class_id` values; the current `ipcamera` pedestrian OSD draws boxes but does not render these class-name strings. An application that needs visible names must map `class_id` to the `types` array itself.

The decoder also contains the standard YOLOv5 anchors in `tdl_sdk/src/components/nn/object_detection/yolov5.cpp`. If training generated different anchors, replace `initial_anchors` with the 18 training values in the same detection-head order. Incorrect anchors can produce boxes with valid scores but incorrect positions or sizes.

### Register the Model with TDL SDK

There are two supported integration patterns. Reusing the generic model ID is simpler when the firmware contains one private YOLOv5 model. A dedicated ID is clearer when several YOLOv5 models must coexist or other application code needs to distinguish them.

#### Option A: Reuse the Generic YOLOv5 ID

The model list already declares `YOLOV5`, which becomes `TDL_MODEL_YOLOV5` in the C API. However, the current factory does not create a `YoloV5Detection` instance for this generic ID. In `tdl_sdk/src/components/nn/factory/tdl_model_factory_internal.cpp`, add a branch to `createObjectDetectionModel()`:

```cpp
} else if (model_type == ModelType::YOLOV5) {
  model_category = 4;  // YOLOV5
  num_classes = 3;     // Replace with the model's class count.
```

`isObjectDetectionModel()` already contains `ModelType::YOLOV5`, so no change is required there for the generic-ID path.

Next, update the `YOLOV5` entry under `model_list` in `tdl_sdk/configs/model/model_factory.json`:

```json
"YOLOV5": {
  "types": ["person", "helmet", "vehicle"],
  "file_name": "yolov5n_cv184x_int8.bmodel"
}
```

Replace the three example names and `num_classes = 3` with the class list and count from the training dataset. The explicit path supplied by `ipcamera` is used to open the model; `file_name` keeps the factory metadata complete and also supports callers that resolve models through a configured model directory.

#### Option B: Add a Dedicated Model ID

For a separately named model, add an entry to `MODEL_TYPE_LIST` in `tdl_sdk/include/nn/tdl_model_list.h`. Do not include the `TDL_MODEL_` prefix in this file:

```cpp
X(YOLOV5N_DET_CUSTOM, "0:person,1:helmet,2:vehicle") \
```

This macro automatically generates `ModelType::YOLOV5N_DET_CUSTOM` and the C API value `TDL_MODEL_YOLOV5N_DET_CUSTOM`.

Then make both changes in `tdl_model_factory_internal.cpp`:

1. Add `ModelType::YOLOV5N_DET_CUSTOM` to `isObjectDetectionModel()`.
2. Add its factory branch to `createObjectDetectionModel()`:

```cpp
} else if (model_type == ModelType::YOLOV5N_DET_CUSTOM) {
  model_category = 4;  // YOLOV5
  num_classes = 3;
```

If downstream logic uses semantic `TDLObjectType` values, also populate `model_type_mapping` for every known class in this branch. Classes without a suitable `TDLObjectType` can still be distinguished by numeric `class_id`.

Finally, add a matching key to `model_factory.json`:

```json
"YOLOV5N_DET_CUSTOM": {
  "types": ["person", "helmet", "vehicle"],
  "file_name": "yolov5n_cv184x_int8.bmodel"
}
```

The key must exactly match the name in `tdl_model_list.h`. Use this dedicated ID instead of `TDL_MODEL_YOLOV5` in the remaining examples if you choose this option.

### Allow `ipcamera` to Select the YOLOv5 Model

The existing pedestrian-detection module accepts only `TDL_MODEL_YOLOV8N_DET_MONITOR_PERSON`. Extend the following integration points for either `TDL_MODEL_YOLOV5` or the dedicated ID.

In `ipcamera/modules/common/paramparse/ai/src/app_ipcam_param_ai.c`, add the ID to `ai_supported_model` so the INI parser can convert its string form:

```c
[TDL_MODEL_YOLOV5] = MODEL_NAME(TDL_MODEL_YOLOV5),
```

In `ipcamera/modules/ai/pd/src/app_ipcam_ai_pd.c`, add the ID to `app_ipcam_Ai_InferenceFunc_Get()`:

```c
case TDL_MODEL_YOLOV5:
    g_pfpPDInference = TDL_Detection;
    break;
```

The pedestrian module currently passes `NULL` as the model-factory configuration path. Add `model_path_cfg` to `APP_PARAM_AI_PD_CFG_S` in `ipcamera/modules/ai/include/app_ipcam_ai.h`:

```c
char model_path[MODEL_PATH_LEN];
char model_path_cfg[MODEL_PATH_LEN];
```

Read the new key in `ipcamera/modules/common/paramparse/ai_pd/src/app_ipcam_param_ai_pd.c`:

```c
ini_gets(tmp_section, "model_path_cfg", " ", tmp_buff, sizeof(tmp_buff), file);
app_ipcam_Param_CopyString(Ai->model_path_cfg,
    sizeof(Ai->model_path_cfg), tmp_buff);
```

Finally, pass it to `TDL_OpenModel()` in `app_ipcam_ai_pd.c`:

```c
s32Ret = TDL_OpenModel(g_PDAiHandle, g_pstPdCfg->model_id,
    g_pstPdCfg->model_path, g_pstPdCfg->model_path_cfg, 0);
```

This causes the installed `model_factory.json` to be loaded before the factory creates the YOLOv5 decoder.

### Add the BModel as an `ipcamera` Resource

Copy the generated model into the SDK resource directory:

```bash
cd /workspace/aimorelogy-ovis-sdk
cp /workspace/yolov5-export/yolov5n_cv184x_int8.bmodel \
  ipcamera/resource/ai_model/
```

Add a resource option to `ipcamera/build/resource/Kconfig` under the CV184X AI model menu:

```text
config RESOURCE_INSTALL_YOLOV5N_CUSTOM
	bool "install custom yolov5n model"
	default n
	help
		Install the custom YOLOv5n BModel.
```

Enable it in the Ovis application defconfig, `ipcamera/configs/cv184x_ovis_app_defconfig`:

```text
CONFIG_RESOURCE_INSTALL_YOLOV5N_CUSTOM=y
```

Add the corresponding installation rule to `ipcamera/build/install.mk`:

```make
ifeq ($(CONFIG_RESOURCE_INSTALL_YOLOV5N_CUSTOM),y)
	@mkdir -p $(APP_INSTALL_DIR)/cv184x/
	@cp -f $(APP_RESOURCE_DIR)/ai_model/yolov5n_cv184x_int8.bmodel \
		$(APP_INSTALL_DIR)/cv184x/
endif
```

When `CONFIG_MODULE_AI=y`, the same install target already copies the TDL SDK factory file from `tdl_sdk/install/CV184X/configs/model/model_factory.json` to `ipcamera/install/model_factory.json`. Keep `TPU_REL=1` during the full build so the modified TDL SDK and its JSON file are rebuilt before `ipcamera` is installed.

### Update the Ovis INI Configuration

Edit the source configuration at `ipcamera/resource/parameter/sbm/cv1842hp_ovis_sc235hai.ini`. For the generic-ID path, update the pedestrian-detection section as follows:

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

`grp_width` and `grp_height` describe the actual frame received from the configured VPSS channel and are also used to scale OSD boxes. If changing them to `640 x 384`, also change `width` and `height` under `[vpssgrp2.chn0]` to `640` and `384`. Do not change only the AI section. It is also valid to retain the existing `448 x 256` VPSS frame and let TDL preprocessing resize it to the model input, but the two INI sections must remain consistent with each other.

Use the dedicated model ID in `model_id` if you created one. Set `pd_enable = 1` only when pedestrian detection should start automatically; it can otherwise remain disabled and be enabled through Ovis Manager.

### Keep Ovis Manager from Restoring the Old Model

The runtime configuration is `/mnt/cfg/ipcamera/param_config.ini`, not the copy under `/usr/share/ipcamera`. Ovis Manager creates it from the installed default only when no valid runtime configuration exists.

In addition, `ovis-manager/backend/src/config_store.c` currently migrates `ai_pd_config.model_path` to the built-in YOLOv8 model path. Update `migrate_runtime_config()` so its `ini_update` entries use the selected YOLOv5 model ID, model path, and factory path:

```c
{ "ai_pd_config", "model_id", "TDL_MODEL_YOLOV5", 0 },
{ "ai_pd_config", "model_path",
  "\"/usr/share/ipcamera/cv184x/yolov5n_cv184x_int8.bmodel\"", 0 },
{ "ai_pd_config", "model_path_cfg",
  "\"/usr/share/ipcamera/model_factory.json\"", 0 },
```

Also update the migration index list or surrounding migration logic so all three entries are applied. Otherwise, an existing device can keep the old model ID or have its custom model path changed back at boot.

After installing the new firmware on a device that already has a runtime configuration, either update `/mnt/cfg/ipcamera/param_config.ini` with the same three values or restore the Ovis configuration to the new firmware defaults. Back up the existing configuration first. Changing only the source INI does not replace an already valid file in `/mnt/cfg`.

### Build and Package the Firmware

Run the complete Ovis build with the `ovis_spinand` board target:

```bash
cd /workspace/aimorelogy-ovis-sdk
source build/envsetup_soc.sh
defconfig ovis_spinand
export TPU_REL=1
clean_all
build_all
```

For this target, `build_all` performs the relevant steps in this order:

1. `build_tdl_sdk` rebuilds the modified model factory and stages `model_factory.json`.
2. `build_ipcamera` always loads `cv184x_ovis_app_defconfig`, builds the application, and runs its install target.
3. The resource rule copies the BModel to `ipcamera/install/cv184x/`.
4. Root filesystem preparation copies all of `ipcamera/install` to `install/soc_ovis_spinand/rootfs/usr/share/ipcamera/`.
5. `pack_rootfs` packages that directory into `rootfs.spinand`, and `pack_upgrade` includes the image in `aimorelogy_ovis_firmware.zip`.

The BModel is therefore packaged in `rootfs.spinand`, even though the board also has a separate `system.spinand` partition. Check the staged files and final package after the build:

```bash
test -f ipcamera/install/cv184x/yolov5n_cv184x_int8.bmodel
test -f ipcamera/install/model_factory.json
test -f install/soc_ovis_spinand/rootfs/usr/share/ipcamera/cv184x/yolov5n_cv184x_int8.bmodel
grep -A4 '"YOLOV5"' ipcamera/install/model_factory.json
ls -lh install/soc_ovis_spinand/rootfs.spinand
ls -lh install/soc_ovis_spinand/aimorelogy_ovis_firmware.zip
```

The `ovis_spinand` root filesystem partition is configured for 71,680 KiB. Check the image and partition usage when adding a large model; increasing the partition requires a coordinated flash-layout change and must not be done only to the generated XML.

After flashing, verify the runtime files on the device:

```bash
ls -lh /usr/share/ipcamera/cv184x/yolov5n_cv184x_int8.bmodel
grep -A4 '"YOLOV5"' /usr/share/ipcamera/model_factory.json
grep -A10 '^\[ai_pd_config\]' /mnt/cfg/ipcamera/param_config.ini
```

If model opening fails, first check that the selected model ID reaches the YOLOv5 factory branch, the class count and anchors match training, `model_path_cfg` points to a readable JSON file, and the BModel was compiled with `--processor cv184x`.

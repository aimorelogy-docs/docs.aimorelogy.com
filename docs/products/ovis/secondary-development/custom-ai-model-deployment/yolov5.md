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

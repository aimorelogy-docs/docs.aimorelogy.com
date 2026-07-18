---
id: sdk-compilation
slug: /products/ovis/secondary-development/sdk-compilation
title: SDK Compilation
description: Get the Ovis SDK, understand its structure, and compile the firmware.
---

# SDK Compilation

AIMORELOGY Ovis provides a complete SDK for application development and system customization. The SDK covers the full software stack, from boot firmware, operating systems, and device drivers to multimedia processing, AI inference, and Ovis applications. It also provides a unified workflow for configuration, compilation, and firmware packaging.

## Get the SDK

The Ovis SDK source code is hosted in the [aimorelogy-ovis-sdk repository](https://github.com/aimorelogy-ovis/aimorelogy-ovis-sdk) on GitHub. Clone the repository to your development machine:

```bash
git clone https://github.com/aimorelogy-ovis/aimorelogy-ovis-sdk.git
cd aimorelogy-ovis-sdk
```

The repository contains the platform source code, Ovis board configuration, cross-compilation toolchain, build scripts, and firmware packaging tools required for development. Unless otherwise stated, the commands in this guide should be run from the SDK root directory.

## SDK Structure

```text
aimorelogy-ovis-sdk/
|-- build/                         # Board configuration, build entry points, and packaging scripts
|-- host-tools/                    # Cross-compilation toolchains and host utilities
|-- fsbl/                          # FSBL, ATF, and other early boot firmware
|-- u-boot-2021.10/                # U-Boot bootloader
|-- linux_5.10/                    # Linux 5.10 kernel
|-- ramdisk/                       # Root filesystem, initramfs, and system configuration
|-- rt-thread/                     # RT-Thread real-time operating system
|-- cvi_alios/                     # AliOS and dual-OS components
|-- osdrv/                         # Low-level SoC and peripheral drivers
|-- osal/                          # Operating system abstraction layer
|-- cvi_mpi/                       # Media Processing Interface libraries, samples, and tools
|-- cvi_rtsp/                      # RTSP streaming library and service components
|-- isp-tool-daemon/               # Device-side service for ISP debugging tools
|-- isp_tuning/                    # ISP image-quality tuning parameters and utilities
|-- ive/                           # Hardware-accelerated image processing library
|-- libsophon/                     # TPU driver, runtime libraries, and supporting tools
|-- tdl_sdk/                       # Turnkey deep-learning algorithms and development APIs
|-- ipcamera/                      # Video, audio, AI, peripheral, and protocol application
|-- ovis-manager/                  # Ovis device management and configuration service
|-- oss/                           # Open-source third-party packages used by the SDK
|-- include/                       # Shared generated configuration headers
`-- install/                       # Generated firmware images, upgrade packages, and staged files
```

The `build/` directory is the main SDK entry point. It provides the `ovis_spinand` board target and orchestrates component builds and firmware image packaging. The `ipcamera/` application integrates video capture, image processing, encoding, RTSP/UVC, peripheral control, and on-device AI features. The `ovis-manager/` service handles device identification, runtime configuration, service control, and version reporting. Developers can modify individual components and use the SDK build system to integrate the resulting artifacts into Ovis firmware.

## Prepare the Build Environment

AIMORELOGY provides a preconfigured Docker image for building the Ovis SDK. Building inside the container keeps the toolchain and dependency versions consistent and reduces differences between host environments.

### Install Docker

Install Docker for your development host:

- Windows: [Install Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/). The WSL 2 backend is recommended.
- macOS: [Install Docker Desktop for Mac](https://docs.docker.com/desktop/setup/install/mac-install/).
- Linux: [Install Docker Engine](https://docs.docker.com/engine/install/) and follow the instructions for your distribution.

After installation, verify that Docker can start containers:

```bash
docker --version
docker run --rm hello-world
```

### Pull the Build Image

Pull the latest Ovis SDK build image from Docker Hub:

```bash
docker pull aimorelogy/ovis-build-docker:latest
```

The initial download time depends on your network connection. Run the same command again whenever you need to update the local image to the latest version.

### Start the Build Container

The following example uses Bash syntax and mounts the host `~/projects` directory at `/workspace` inside the container. On Windows, run it from a WSL 2 terminal. Ensure that the Ovis SDK is located at `~/projects/aimorelogy-ovis-sdk`, or adjust the `-v` argument to match its actual location:

```bash
docker run -it --rm --privileged -v /dev:/dev -v ~/projects:/workspace -w /workspace aimorelogy/ovis-build-docker:latest /bin/bash
```

After the container starts, change to the SDK root directory:

```bash
cd /workspace/aimorelogy-ovis-sdk
```

The `--rm` option removes the container when you exit, while the bind mount keeps the SDK source code and build artifacts on the host. The `--privileged` option and `/dev` mapping provide device access where supported; the available passthrough capabilities depend on the host operating system and Docker backend. Use this configuration only on a trusted development host. Unless otherwise stated, run subsequent build commands inside this container.

## Build the SDK

Use the following workflow to perform a complete clean build of the Ovis SDK. Run all commands in the same Docker container terminal:

```bash
cd /workspace/aimorelogy-ovis-sdk
source build/envsetup_soc.sh
defconfig ovis_spinand
export TPU_REL=1
clean_all
build_all
```

Each command performs the following task:

1. `cd /workspace/aimorelogy-ovis-sdk`

   Changes to the SDK root directory. The build scripts use paths relative to the repository root, so run all subsequent commands from this directory.

2. `source build/envsetup_soc.sh`

   Initializes the SDK build environment, sets the toolchain, source, and output path variables, and loads build functions such as `defconfig`, `clean_all`, and `build_all` into the current shell. Run this command again whenever you start a new container or terminal.

3. `defconfig ovis_spinand`

   Selects the Ovis SPI NAND board configuration and generates the active build configuration and partition information. `ovis_spinand` is the public build target for the Ovis board, and its firmware is written to `install/soc_ovis_spinand`.

   > **Caution:** `defconfig` refreshes the active `build/.config` from the board defaults. If you have custom options from `menuconfig` that have not been saved to the board defconfig, back them up or verify them before continuing.

4. `export TPU_REL=1`

   Enables the TPU-related components, including the TPU kernel, IVE, IVS, and TDL SDK. These components are required by the on-device AI features in the complete Ovis firmware.

5. `clean_all`

   Removes existing build outputs for the kernel, bootloader, drivers, middleware, AI components, and Ovis applications so stale files do not affect the full build. Use this step for a first build, after changing the board configuration, or when regenerating a complete firmware set. A component-only change usually does not require a full clean.

6. `build_all`

   Builds the kernel, U-Boot and boot firmware, drivers, third-party libraries, multimedia and RTSP components, TPU/AI components, ISP tools, `ipcamera`, and `ovis-manager`. It then creates the partition images and packages the flashable firmware. Run this command only after `clean_all` completes successfully.

### Locate the Build Outputs

After a successful full build, the firmware and intermediate artifacts are available under:

```text
install/soc_ovis_spinand/
```

This directory contains partition images such as `fip.bin`, `boot.spinand`, `rootfs.spinand`, `system.spinand`, `cfg.spinand`, and `data.spinand`. For normal Ovis flashing, use the following package:

```text
install/soc_ovis_spinand/aimorelogy_ovis_firmware.zip
```

The ZIP package contains the required partition images, partition description, update scripts, and supporting tools. Before flashing, confirm that the file was generated and check its modification time:

```bash
ls -lh install/soc_ovis_spinand/aimorelogy_ovis_firmware.zip
```

Do not mix the top-level `.spinand` files, raw images under `rawimages/`, and the complete ZIP package unless a debugging or manufacturing workflow explicitly requires a specific image format.

---
id: secondary-development
slug: /products/ovis/secondary-development
title: Secondary Development
description: Secondary development and integration resources for Ovis.
---

# Secondary Development

AIMORELOGY Ovis provides a complete SDK for application development and system customization. The SDK covers the full software stack, from boot firmware, operating systems, and device drivers to multimedia processing, AI inference, and Ovis applications. It also provides a unified workflow for configuration, compilation, and firmware packaging.

## Get the SDK

The Ovis SDK source code is hosted in the [aimorelogy-ovis-sdk repository](https://github.com/IamYiranKe/aimorelogy-ovis-sdk) on GitHub. Clone the repository to your development machine:

```bash
git clone https://github.com/IamYiranKe/aimorelogy-ovis-sdk.git
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

The `build/` directory is the main SDK entry point. It contains the `cv1842hp_ovis_spinand` board configuration and orchestrates component builds and firmware image packaging. The `ipcamera/` application integrates video capture, image processing, encoding, RTSP/UVC, peripheral control, and on-device AI features. The `ovis-manager/` service handles device identification, runtime configuration, service control, and version reporting. Developers can modify individual components and use the SDK build system to integrate the resulting artifacts into Ovis firmware.

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

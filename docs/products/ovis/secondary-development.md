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

The `build/` directory is the main SDK entry point. It provides the `ovis_spinand` board target and orchestrates component builds and firmware image packaging. The `ipcamera/` application integrates video capture, image processing, encoding, RTSP/UVC, peripheral control, and on-device AI features. The `ovis-manager/` service handles device identification, runtime configuration, service control, and version reporting. Developers can modify individual components and use the SDK build system to integrate the resulting artifacts into Ovis firmware.

## Development Guides

- [SDK Compilation](./secondary-development/sdk-compilation.md)
- [Custom AI Model Deployment](./secondary-development/custom-ai-model-deployment.md)

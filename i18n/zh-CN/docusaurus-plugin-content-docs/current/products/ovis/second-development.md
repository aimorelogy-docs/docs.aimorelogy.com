---
id: second-development
slug: /products/ovis/second-development
title: 二次开发
description: Ovis 二次开发与集成资料。
---

# 二次开发

AIMORELOGY Ovis 提供完整的 SDK，支持应用开发与系统定制。该 SDK 覆盖从启动固件、操作系统和设备驱动，到多媒体处理、AI 推理及 Ovis 应用的完整软件栈，并提供统一的配置、编译与固件打包流程。

## 获取 SDK

Ovis SDK 源代码托管于 GitHub 的 [aimorelogy-ovis-sdk 仓库](https://github.com/IamYiranKe/aimorelogy-ovis-sdk)。请将仓库克隆到开发主机：

```bash
git clone https://github.com/IamYiranKe/aimorelogy-ovis-sdk.git
cd aimorelogy-ovis-sdk
```

该仓库包含开发所需的平台源代码、Ovis 板级配置、交叉编译工具链、构建脚本与固件打包工具。除非另有说明，本指南中的命令均应在 SDK 根目录下执行。

## SDK 结构

```text
aimorelogy-ovis-sdk/
|-- build/                         # 板级配置、构建入口与固件打包脚本
|-- host-tools/                    # 交叉编译工具链与主机端工具
|-- fsbl/                          # FSBL、ATF 及其他早期启动固件
|-- u-boot-2021.10/                # U-Boot 引导程序
|-- linux_5.10/                    # Linux 5.10 内核
|-- ramdisk/                       # 根文件系统、initramfs 与系统配置
|-- rt-thread/                     # RT-Thread 实时操作系统
|-- cvi_alios/                     # AliOS 与双系统相关组件
|-- osdrv/                         # SoC 与外设底层驱动
|-- osal/                          # 操作系统抽象层
|-- cvi_mpi/                       # 多媒体处理接口库、示例与工具
|-- cvi_rtsp/                      # RTSP 推流库与服务组件
|-- isp-tool-daemon/               # 对接 ISP 调试工具的板端服务
|-- isp_tuning/                    # ISP 图像质量调优参数与工具
|-- ive/                           # 硬件加速图像处理库
|-- libsophon/                     # TPU 驱动、运行时库与配套工具
|-- tdl_sdk/                       # 开箱即用的深度学习算法与开发接口
|-- ipcamera/                      # 视频、音频、AI、外设及协议业务应用
|-- ovis-manager/                  # Ovis 设备管理与配置服务
|-- oss/                           # SDK 使用的开源第三方软件包
|-- include/                       # 共享的生成配置头文件
`-- install/                       # 生成的固件镜像、升级包与暂存文件
```

`build/` 是 SDK 的主要入口，其中包含 `cv1842hp_ovis_spinand` 板级配置，并负责组织各组件的构建与固件镜像打包。`ipcamera/` 应用集成视频采集、图像处理、编码、RTSP/UVC、外设控制与端侧 AI 功能。`ovis-manager/` 服务负责设备识别、运行配置、服务控制与版本信息查询。开发者可以按需修改单个组件，再通过 SDK 构建系统将生成的产物集成到 Ovis 固件中。

## 编译环境准备

AIMORELOGY 为开发者提供了预配置的 Docker 编译镜像。建议在容器内编译 SDK，以统一工具链与依赖版本，减少不同主机环境导致的构建差异。

### 安装 Docker

请根据开发主机的操作系统安装 Docker：

- Windows：[安装 Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/)，建议使用 WSL 2 后端。
- macOS：[安装 Docker Desktop for Mac](https://docs.docker.com/desktop/setup/install/mac-install/)。
- Linux：[安装 Docker Engine](https://docs.docker.com/engine/install/)，并按照对应发行版的说明完成配置。

安装完成后，运行以下命令确认 Docker 可以正常启动容器：

```bash
docker --version
docker run --rm hello-world
```

### 拉取编译镜像

从 Docker Hub 拉取最新的 Ovis SDK 编译镜像：

```bash
docker pull aimorelogy/ovis-build-docker:latest
```

首次拉取所需时间取决于网络状况。后续可再次执行相同命令，将本地镜像更新至最新版本。

### 启动编译容器

以下示例使用 Bash 语法，将主机的 `~/projects` 目录挂载到容器内的 `/workspace`。Windows 用户应在 WSL 2 终端中执行。请确保 Ovis SDK 位于 `~/projects/aimorelogy-ovis-sdk`，或根据实际存放位置调整 `-v` 参数：

```bash
docker run -it --rm --privileged -v /dev:/dev -v ~/projects:/workspace -w /workspace aimorelogy/ovis-build-docker:latest /bin/bash
```

进入容器后，切换到 SDK 根目录：

```bash
cd /workspace/aimorelogy-ovis-sdk
```

`--rm` 会在退出后自动删除容器，SDK 源代码与编译产物则通过目录挂载保留在主机上。`--privileged` 和 `/dev` 映射用于为容器提供设备访问能力；实际可用范围取决于主机操作系统与 Docker 后端，请仅在可信的开发主机上使用该配置。除非另有说明，后续编译命令均在此容器内执行。

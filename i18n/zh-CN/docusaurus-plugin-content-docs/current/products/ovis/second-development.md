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

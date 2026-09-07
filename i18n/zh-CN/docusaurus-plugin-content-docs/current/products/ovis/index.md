---
id: index
slug: /products/ovis
title: Ovis
description: 爱谋科技 Ovis 是一款紧凑型 1.5 TOPS AI 视觉摄像头模组，支持低照度全彩成像和浏览器配置。
hide_table_of_contents: true
---

# Ovis

![爱谋科技 Ovis AI 视觉摄像头模组及应用示例](/img/products/ovis/overview/ovis-main.png)

Ovis 是爱谋科技推出的紧凑型 AI 视觉摄像头模组，搭载 CVITEK CV1842H-P SoC，内置 1.5 TOPS INT8 TPU，支持 BF16。模组提供两种可切换的工作模式：AI-ISP 全彩夜视模式可对低照度视频进行图像增强，最高支持 1080p @ 30fps；板载 AI 推理模式可直接在模组上运行受支持的视觉模型。Ovis 支持通过浏览器进行无代码配置，提供 USB、以太网视频输出及 UART 接口，既可作为树莓派、PC 等主机的低照度视频前端，也可作为独立的边缘 AI 模组。紧凑的模块化堆叠结构便于集成到无人机、机器人、安防系统及定制嵌入式视觉产品中，并支持二次开发和定制载板设计。

## 产品规格

| 参数 | 规格 |
| --- | --- |
| 产品名称 | Ovis |
| 产品定位 | 1.5 TOPS AI-ISP 夜视摄像头模组 |
| SoC | CVITEK CV1842H-P |
| CPU | ARM Cortex-A53 @ 1.1 GHz + RISC-V C906 @ 800 MHz |
| AI 算力 | 1.5 TOPS @ INT8，支持 BF16 |
| AI-ISP | 实时 1080p @ 30fps 全彩夜视 |
| 视觉模式 | AI-ISP 夜视 / 板载 AI 推理 |
| AI 工作流 | YOLO、ResNet50 v2、MobileNet v2、车辆识别、人体识别及姿态识别 |
| 配置方式 | 基于浏览器的无代码配置 |
| 接口 | USB / 以太网 / UART |
| 支持的主机平台 | Windows、macOS、Linux、Raspberry Pi（树莓派）、Radxa（瑞莎）、Orange Pi（香橙派）及 Linux 单板计算机 |
| 开放资源 | 硬件设计文件、结构文件、软件源代码及文档 |
| 开发支持 | 支持二次开发及定制载板设计 |
| 结构 | 超紧凑模块化堆叠设计 |
| 应用场景 | 无人机、机器人、安防、边缘 AI、嵌入式视觉及智能摄像头 |
| Ovis Core 尺寸 | 20 x 20 x 5.7 mm |
| 标准套件尺寸（含镜头） | 28 x 28 x 31.7 mm |

## 硬件与接口

### Ovis Core 核心板

核心板集成 CV1842H-P SoC 和 2 Gb NAND Flash，提供 USB 接口、UART 调试焊盘及两个 50 Pin 板对板连接器。

![Ovis Core 核心板正反面标注：CV1842H-P、NAND Flash、USB、调试 UART 和板对板连接器](/img/products/ovis/overview/ovis-core-interfaces.png)

### 传感器板

传感器板采用 SC235HAI 图像传感器，提供 UART、以太网接口及两个 50 Pin 板对板连接器。

![Ovis 传感器板正反面标注：SC235HAI 传感器、UART、以太网和板对板连接器](/img/products/ovis/overview/ovis-sensor-interfaces.jpg)

### CVBS 输出板

CVBS 输出板采用 MS7024，提供 UART 和 CVBS 接口，正反面均配有用于堆叠连接的 50 Pin 板对板连接器。该板包含在 CVBS Kit 套件中。

![Ovis CVBS 输出板正反面标注：MS7024、UART、CVBS 和板对板连接器](/img/products/ovis/overview/ovis-cvbs-interfaces.png)

## 文档目录

- [快速开始](./getting-started.md)
- [二次开发](./secondary-development.md)
- [资源下载](./resource-download.md)

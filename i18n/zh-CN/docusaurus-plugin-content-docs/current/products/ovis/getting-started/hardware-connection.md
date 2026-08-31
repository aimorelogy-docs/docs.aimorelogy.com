---
id: hardware-connection
slug: /products/ovis/getting-started/hardware-connection
title: 组装与连接 OVIS
description: 组装 OVIS 摄像头板和 OVIS Core 板，并识别 USB 与 UART0 接口。
---

# 组装与连接 OVIS

OVIS 由摄像头板和 OVIS Core 板组成。连接 USB 或 UART0 前，需要先按正确方向完成两块板的组装。

:::caution

组装或拆分板卡前，请断开 USB 和 UART 连接。

:::

## 组装板卡

1. 找到两块板左上角的白色方向标记。
2. 让两个白色角朝向同一方向，再对齐板间连接器。
3. 保持两块板平行，均匀向下按压，直至连接器装配到位。

![对齐白色方向标记并组装 OVIS 摄像头板和 OVIS Core 板](/img/products/ovis/hardware-connection/01-align-and-assemble.png)

## 识别接口

下图标出了连接和固件烧录需要使用的两个接口：

1. **USB** 接口。
2. **UART0** 串口。

![OVIS Core 板上的 USB 和 UART0 接口位置](/img/products/ovis/hardware-connection/02-usb-uart0-connectors.png)

固件烧录步骤请参阅[烧录 OVIS 固件](./software-flashing.md)。

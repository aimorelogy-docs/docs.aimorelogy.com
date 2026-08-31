---
id: software-flashing
slug: /products/ovis/getting-started/software-flashing
title: 烧录 OVIS 固件
description: 在 Windows 电脑上通过 USB 或 UART 烧录 OVIS 固件。
---

# 烧录 OVIS 固件

OVIS 支持通过 USB 和 UART 两种方式烧录固件。日常烧录请使用 USB；UART 传输速度较慢，适合在 USB 烧录不可用时作为备用方案。

:::warning

烧录会覆盖设备中已有的固件。请使用官方提供的 `aimorelogy_ovis_firmware.zip`，保持设备供电稳定。写入完成前，不要关闭终端或断开线缆。

:::

## 开始前的准备

请准备以下内容：

- 一台 Windows 电脑。
- OVIS 设备和一根支持数据传输的 USB 线。
- `aimorelogy_ovis_firmware.zip` 固件包。
- USB 烧录使用 `usb_dl.exe`，UART 烧录使用 `uart_dl.exe`。

### 下载烧录工具

<div className="flashing-tool-downloads">
  <a className="button button--primary" href="/downloads/ovis/flashing-tools/usb_dl.exe" download="usb_dl.exe">
    下载 USB 烧录工具（288 KiB）
  </a>
  <a className="button button--secondary button--outline" href="/downloads/ovis/flashing-tools/uart_dl.exe" download="uart_dl.exe">
    下载 UART 烧录工具（524 KiB）
  </a>
</div>

下文命令使用 PowerShell 语法。请在对应烧录工具所在目录中打开 PowerShell。

## 方式一：USB 烧录（推荐）

USB 烧录速度明显快于 UART，建议优先使用。

### 准备固件目录

将 `usb_dl.exe` 放入烧录工作目录，并在同级目录新建名为 `rom` 的文件夹。解压 `aimorelogy_ovis_firmware.zip`，把解压得到的全部文件和目录复制到 `rom` 中。

整理后的目录结构如下：

```text
ovis-flashing-tool/
|-- usb_dl.exe
`-- rom/
    |-- <固件文件>
    `-- <固件目录>
```

`rom` 中需要直接放置固件包的解压内容。不要把 ZIP 文件本身放入 `rom`，也不要在 `rom` 和固件文件之间多套一层以固件包命名的目录。

### 开始烧录

在 `usb_dl.exe` 所在目录执行：

```powershell
.\usb_dl.exe -c cv184x -i .\rom
```

命令启动并等待设备连接后，通过以下任一方式让 OVIS 重新启动：

- 在串口终端输入 `REBOOT`。
- 拔出并重新插入 USB 线。

设备重启后，烧录工具会识别设备并开始写入固件。终端提示烧录完成前，请保持 USB 连接稳定。烧录成功后，如果设备没有自动重启，请通过串口输入 `REBOOT`，或重新插拔一次 USB 线。

## 方式二：UART 烧录

USB 烧录无法使用时，可以改用 UART。UART 传输完整固件需要较长时间。

### 查看 COM 端口

将 OVIS 的 UART 接口连接到电脑，打开 Windows“设备管理器”，展开“端口（COM 和 LPT）”，记录设备对应的端口号，例如 `COM3`。

执行烧录前，请关闭正在占用该 COM 端口的串口终端或其他程序。

### 准备固件目录

解压 `aimorelogy_ovis_firmware.zip`，找到其中的 `rawimages` 目录。UART 命令使用 `rawimages` 的实际路径，不使用 USB 烧录步骤中的 `rom` 目录。

例如：

```text
D:\firmware\rawimages
```

### 开始烧录

在 `uart_dl.exe` 所在目录打开 PowerShell。将示例路径和 `COM3` 替换为电脑上的实际值：

```powershell
.\uart_dl.exe -c cv184x -i "D:\firmware\rawimages" -p COM3
```

固件路径包含空格时，请保留路径两侧的英文双引号。命令启动并等待设备连接后，在串口终端输入 `REBOOT`，或重新插拔 USB 线，让烧录工具建立 UART 连接。命令结束前，请勿断开 UART 或设备电源。

## 常见问题

### USB 烧录没有开始

- 检查 USB 线是否支持数据传输，接口是否连接牢固。
- 先运行 `usb_dl.exe`，再通过串口输入 `REBOOT` 或重新插拔 USB 线。
- 检查烧录工具配套的 Windows USB 驱动是否已正确安装。
- 确认 `rom` 与 `usb_dl.exe` 位于同一级目录，固件解压内容直接放在 `rom` 中。

### UART 无法打开 COM 端口

- 在设备管理器中重新确认端口号。重新连接串口设备后，Windows 可能会分配新的端口号。
- 关闭串口终端和其他可能占用该端口的程序。
- 确认 `-p` 后的值与设备管理器显示一致，例如 `COM3`。

### 烧录工具提示固件目录无效

USB 烧录使用 `rom`，UART 烧录使用固件包解压后的 `rawimages` 目录。请勿混用两种目录结构，也不要把 `aimorelogy_ovis_firmware.zip` 直接传给烧录命令。

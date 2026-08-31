---
id: software-flashing
slug: /products/ovis/getting-started/software-flashing
title: Flash OVIS Firmware
description: Flash OVIS firmware from Windows over USB or UART.
---

# Flash OVIS Firmware

OVIS supports firmware flashing from Windows over USB or UART. Use USB for routine flashing. UART transfers the same firmware much more slowly and is intended as a fallback when USB flashing is unavailable.

:::warning

Flashing replaces the firmware stored on the device. Use an official `aimorelogy_ovis_firmware.zip` package, keep the device connected to stable power, and do not close the terminal or disconnect the cable while data is being written.

:::

## Before you start

Prepare the following:

- A Windows computer.
- An OVIS device and a data-capable USB cable.
- The `aimorelogy_ovis_firmware.zip` firmware package.
- `usb_dl.exe` for USB flashing or `uart_dl.exe` for UART flashing.

### Download the flashing tools

<div className="flashing-tool-downloads">
  <a className="button button--primary" href="/downloads/ovis/flashing-tools/usb_dl.exe" download="usb_dl.exe">
    Download USB tool (288 KiB)
  </a>
  <a className="button button--secondary button--outline" href="/downloads/ovis/flashing-tools/uart_dl.exe" download="uart_dl.exe">
    Download UART tool (524 KiB)
  </a>
</div>

The commands below use PowerShell syntax. Open PowerShell in the directory that contains the selected flashing tool.

## Method 1: USB flashing (recommended)

USB is the recommended method because it is substantially faster than UART.

### Prepare the firmware directory

Place `usb_dl.exe` in a working directory. Create a folder named `rom` beside it, extract `aimorelogy_ovis_firmware.zip`, and copy all extracted files and directories into `rom`.

The resulting layout should follow this structure:

```text
ovis-flashing-tool/
|-- usb_dl.exe
`-- rom/
    |-- <firmware files>
    `-- <firmware directories>
```

`rom` must contain the extracted firmware contents. Do not place the ZIP file itself in `rom`, and do not add another package-name directory between `rom` and the extracted contents.

### Start flashing

Run the following command from the directory that contains `usb_dl.exe`:

```powershell
.\usb_dl.exe -c cv184x -i .\rom
```

After the command starts and waits for the device, trigger a device reset using either method:

- Press the **REBOOT** button on OVIS.
- Disconnect and reconnect the USB cable.

The reset allows the flashing tool to detect the device and begin writing the firmware. Keep the USB connection stable until the command reports that flashing has completed. If the device does not restart automatically after a successful write, restart it once.

## Method 2: UART flashing

Use UART only when USB flashing cannot be used. Firmware transfer over UART is significantly slower.

### Find the COM port

Connect the OVIS UART interface to the computer, then open **Device Manager** in Windows. Expand **Ports (COM & LPT)** and note the COM number assigned to the device, such as `COM3`.

Close any serial terminal that is using the same COM port before starting the flashing tool.

### Prepare the firmware directory

Extract `aimorelogy_ovis_firmware.zip` and locate its `rawimages` directory. UART flashing uses the extracted `rawimages` path rather than the `rom` directory used by the USB procedure.

For example:

```text
D:\firmware\rawimages
```

### Start flashing

Open PowerShell in the directory that contains `uart_dl.exe`. Replace the example firmware path and `COM3` with the values on your computer:

```powershell
.\uart_dl.exe -c cv184x -i "D:\firmware\rawimages" -p COM3
```

Keep quotation marks around a firmware path that contains spaces. After the command starts and waits for the device, press **REBOOT** or restart the device so the tool can establish the UART connection. Do not disconnect the UART connection or device power before the command finishes.

## Troubleshooting

### USB flashing does not start

- Confirm that the cable supports data transfer and is connected securely.
- Start `usb_dl.exe` before pressing **REBOOT** or reconnecting the USB cable.
- Check that the Windows USB flashing driver supplied with the flashing tools is installed correctly.
- Confirm that `rom` is beside `usb_dl.exe` and contains the extracted firmware contents directly.

### UART cannot open the COM port

- Check the current port number in Device Manager; Windows may assign a different number after reconnecting the adapter.
- Close serial terminals and other programs that may be using the COM port.
- Confirm that the `-p` value exactly matches the displayed port, for example `COM3`.

### The tool rejects the firmware directory

Use the directory required by the selected method: `rom` for USB, and the extracted `rawimages` directory for UART. Do not mix these directory layouts or pass `aimorelogy_ovis_firmware.zip` directly to either command.

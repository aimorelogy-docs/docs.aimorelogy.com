---
id: index
slug: /products/ovis
title: Ovis
description: AIMORELOGY Ovis is a compact 1.5 TOPS AI vision camera module with full-color low-light imaging and browser-based configuration.
hide_table_of_contents: true
---

# Ovis

![AIMORELOGY Ovis AI vision camera module and application examples](/img/products/ovis/overview/ovis-main.png)

Ovis is a compact AI vision camera module from AIMORELOGY, powered by the CVITEK CV1842H-P SoC and a built-in 1.5 TOPS INT8 TPU with BF16 support. It offers two selectable operating modes: AI-ISP full-color night vision, which enhances low-light video at up to 1080p @ 30fps, and onboard AI inference, which runs supported vision models directly on the module. With browser-based no-code configuration, USB and Ethernet video output, and UART connectivity, Ovis can serve as a low-light video front-end for hosts such as Raspberry Pi and PCs, or as a standalone edge AI module. Its compact modular stacked design supports integration into drones, robots, security systems, and custom embedded vision products, with support for secondary development and custom carrier boards.

## Product Specifications

| Parameter | Specification |
| --- | --- |
| Product Name | Ovis |
| Positioning | 1.5 TOPS AI-ISP Night Vision Camera Module |
| SoC | CVITEK CV1842H-P |
| CPU | ARM Cortex-A53 @ 1.1 GHz + RISC-V C906 @ 800 MHz |
| AI Performance | 1.5 TOPS @ INT8, BF16 supported |
| AI-ISP | Real-time 1080p @ 30fps full-color night vision |
| Vision Modes | AI-ISP night vision / Onboard AI inference |
| AI Workflows | YOLO, ResNet50 v2, MobileNet v2, vehicle recognition, human recognition, and pose recognition |
| Configuration | Browser-based no-code configuration |
| Interfaces | USB / Ethernet / UART |
| Host Support | Windows, macOS, Linux, Raspberry Pi, Radxa, Orange Pi, and Linux SBCs |
| Open Resources | Hardware design files, structural files, software source code, and documentation |
| Development | Secondary development and custom carrier board design supported |
| Structure | Ultra-compact modular stacked design |
| Applications | Drones, robotics, security, edge AI, embedded vision, and smart cameras |
| Ovis Core Dimensions | 20 x 20 x 5.7 mm |
| Standard Kit Dimensions (with Lens) | 28 x 28 x 31.7 mm |

## Hardware and Interfaces

### Ovis Core

The core board integrates the CV1842H-P SoC and 2 Gb NAND flash, with a USB connector, UART debug pads, and two 50-pin board-to-board connectors.

![Ovis Core front and back with the CV1842H-P, NAND flash, USB, debug UART, and board-to-board connectors marked](/img/products/ovis/overview/ovis-core-interfaces.png)

### Sensor Board

The sensor board uses the SC235HAI image sensor and provides UART and Ethernet connectors, plus two 50-pin board-to-board connectors.

![Ovis sensor board front and back with the SC235HAI sensor, UART, Ethernet, and board-to-board connectors marked](/img/products/ovis/overview/ovis-sensor-interfaces.jpg)

### CVBS Output Board

The CVBS output board uses the MS7024 and provides UART and CVBS connectors, with 50-pin board-to-board connectors on both sides for stacking. This board is included in the CVBS Kit.

![Ovis CVBS output board front and back with the MS7024, UART, CVBS, and board-to-board connectors marked](/img/products/ovis/overview/ovis-cvbs-interfaces.png)

## Documentation

- [Getting Started](./getting-started.md)
- [Secondary Development](./secondary-development.md)
- [Resource Download](./resource-download.md)

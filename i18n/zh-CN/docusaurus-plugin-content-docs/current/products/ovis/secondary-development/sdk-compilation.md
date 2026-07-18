---
id: sdk-compilation
slug: /products/ovis/secondary-development/sdk-compilation
title: SDK 编译
description: 准备 Ovis SDK 编译环境并完成固件构建。
---

# SDK 编译

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

## 编译 SDK

以下流程用于执行一次完整、干净的 Ovis SDK 构建。所有命令都需要在同一个 Docker 容器终端中执行：

```bash
cd /workspace/aimorelogy-ovis-sdk
source build/envsetup_soc.sh
defconfig ovis_spinand
export TPU_REL=1
clean_all
build_all
```

各命令的作用如下：

1. `cd /workspace/aimorelogy-ovis-sdk`

   进入 SDK 根目录。构建脚本使用相对于仓库根目录的路径，因此请勿在其他目录中执行后续命令。

2. `source build/envsetup_soc.sh`

   初始化 SDK 构建环境，设置工具链、源码和输出目录等环境变量，并在当前 Shell 中加载 `defconfig`、`clean_all`、`build_all` 等构建函数。每次启动新的容器或终端后都需要重新执行此命令。

3. `defconfig ovis_spinand`

   选择 Ovis SPI NAND 板级配置，并生成本次构建使用的活动配置与分区信息。`ovis_spinand` 是 Ovis 板卡的公开构建目标，生成的固件将输出到 `install/soc_ovis_spinand`。

   > **注意：** `defconfig` 会使用板级默认配置刷新当前的 `build/.config`。如果已经通过 `menuconfig` 保存了尚未固化到板级 defconfig 的自定义选项，请先备份或确认这些改动。

4. `export TPU_REL=1`

   启用 TPU 相关组件的构建，包括 TPU Kernel、IVE、IVS 和 TDL SDK。Ovis 的端侧 AI 功能依赖这些组件，因此完整固件构建应保持该变量为 `1`。

5. `clean_all`

   清理内核、引导程序、驱动、中间件、AI 组件和 Ovis 应用等已有构建产物，避免旧文件影响本次完整构建。该步骤适合首次构建、切换板级配置或需要重新生成完整固件时使用；仅修改单个组件时通常不需要执行全量清理。

6. `build_all`

   按顺序构建内核、U-Boot/启动固件、驱动、第三方库、多媒体与 RTSP 组件、TPU/AI 组件、ISP 工具、`ipcamera` 和 `ovis-manager`，随后生成各分区镜像并打包烧录固件。请在 `clean_all` 成功完成后再执行此命令。

### 获取编译产物

完整构建成功后，固件与中间产物位于：

```text
install/soc_ovis_spinand/
```

该目录包含 `fip.bin`、`boot.spinand`、`rootfs.spinand`、`system.spinand`、`cfg.spinand` 和 `data.spinand` 等分区镜像。通常情况下，请直接使用以下文件作为 Ovis 烧录包：

```text
install/soc_ovis_spinand/aimorelogy_ovis_firmware.zip
```

该 ZIP 包已包含烧录所需的分区镜像、分区描述、升级脚本和相关工具。烧录前可确认文件已生成并检查其更新时间：

```bash
ls -lh install/soc_ovis_spinand/aimorelogy_ovis_firmware.zip
```

除非调试或生产流程明确要求使用单独的分区镜像，否则不要将顶层 `.spinand` 文件、`rawimages/` 中的原始镜像与完整 ZIP 烧录包混用。

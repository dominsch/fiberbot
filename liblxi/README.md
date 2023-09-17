# liblxi

[![](https://img.shields.io/circleci/build/github/lxi-tools/liblxi)](https://circleci.com/gh/lxi-tools/liblxi/tree/master)
[![](https://img.shields.io/github/v/release/lxi-tools/liblxi?sort=semver)](https://github.com/lxi-tools/liblxi/releases)
[![](https://img.shields.io/repology/repositories/liblxi)](https://repology.org/project/liblxi/versions)
[![](https://img.shields.io/tokei/lines/github/lxi-tools/liblxi)](https://github.com/lxi-tools/liblxi)


## 1. Introduction

liblxi is an open source software library which offers a simple API for
communicating with LXI compatible instruments. The API allows applications to
discover instruments on your network, send SCPI commands, and receive
responses.

Currently the library supports VXI-11/TCP and RAW/TCP connections. Future work
include adding support for the newer and more efficient HiSlip protocol which
is used by next generation LXI instruments.

The library is based on the VXI-11 RPC protocol implementation which is part of
the asynDriver EPICS module, which, at time of writing, is available [here](http://www.aps.anl.gov/epics/modules/soft/asyn/index.html).

### 1.1 What is LXI?

LAN eXtensions for Instrumentation (LXI) is a standard developed by the LXI
Consortium, an industry consortium that maintains the LXI specification and
promotes the LXI Standard. The LXI standard defines the communication protocols
for modern instrumentation and data acquisition systems using Ethernet.

Visit www.lxistandard.org for more details.

Please notice that liblxi is not affiliated with the LXI consortium - it is
an independent open source community effort.


## 2. The liblxi API

The API is small and simple. It includes functions required for discovering and
communicating SCPI messages with LXI devices:
```
    int lxi_init(void);
    int lxi_discover(struct lxi_info_t *info, int timeout, lxi_discover_t type);
    int lxi_connect(const char *address, int port, const char *name, int timeout, lxi_protocol_t protocol);
    int lxi_send(int device, const char *message, int length, int timeout);
    int lxi_receive(int device, char *message, int length, int timeout);
    int lxi_disconnect(int device);
```
Note: `type` is `DISCOVER_VXI11` or `DISCOVER_MDNS`

Note: `protocol` is `VXI11` or `RAW`


## 3. API usage

Here is a simple code example on how to use the liblxi API:

```
     #include <stdio.h>
     #include <string.h>
     #include <lxi.h>

     int main()
     {
         char response[65536];
         int device, length, timeout = 1000;
         char *command = "*IDN?";

         // Initialize LXI library
         lxi_init();

         // Connect to LXI device
         device = lxi_connect("10.42.0.42", 0, "inst0", timeout, VXI11);

         // Send SCPI command
         lxi_send(device, command, strlen(command), timeout);

         // Wait for response
         lxi_receive(device, response, sizeof(response), timeout);

         printf("%s\n", response);

         // Disconnect
         lxi_disconnect(device);
     }
```
The example above prints the ID string of the LXI instrument. For example, a
Rigol DS1104Z oscilloscope would respond:
```
    RIGOL TECHNOLOGIES,DS1104Z,DS1ZA1234567890,00.04.03
```

See src/test for more examples.


## 4. Installation

### 4.1 Installation from source

The latest source releases can be found [here](https://github.com/lxi-tools/liblxi/releases).

To compile and install successfully from source you need to install the
following dependencies:

 * libtirpc
 * libxml2
 * avahi    (optional)

Install steps:
```
    $ meson setup build
    $ meson compile -C build
    $ meson install -C build
```
Note: Please do no try to install from source if you are not familiar with
using meson.


### 4.2 Installation using package manager (Linux)

liblxi comes prepackaged for various GNU/Linux distributions. Please consult
your package manager tool to find and install lxi-tools.

If you would like to see liblxi included in your favorite distribution, please
reach out to its package maintainers team.

### 4.3 Installation using Homebrew (MacOS, Linux)

If you have [Homebrew](https://brew.sh) installed:

``` shell
    $ brew install liblxi
```


## 5. Contributing

liblxi is open source. If you want to help out with the project please feel
free to join in.

All contributions (bug reports, code, doc, ideas, etc.) are welcome.

Please use the github issue tracker and pull request features.


Also, if you find this free open source software useful please feel free to
consider making a donation of your choice:

[![Donate](https://raw.githubusercontent.com/lxi-tools/lxi-tools/master/images/Paypal.png)](https://www.paypal.me/lundmar)


## 6. Website

Visit [lxi-tools.github.io](https://lxi-tools.github.io)


## 7. License

liblxi includes code covered by the following licenses:

 * BSD-3, commonly known as the 3-clause (or "modified") BSD license
 * EPICS Open software license

For license details please see the COPYING file.


## 8. Authors

Created by Martin Lund \<martin.lund@keep-it-simple.com>

See the AUTHORS file for full list of contributors.

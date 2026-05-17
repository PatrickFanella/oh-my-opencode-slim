# Memory Forensics (Full Guide)

Comprehensive memory acquisition and analysis workflow for IR and malware triage.

## Acquisition

## Windows

```powershell
# WinPmem (recommended)
winpmem_mini_x64.exe memory.raw

# DumpIt
DumpIt.exe
```

## Linux

```bash
# LiME
sudo insmod lime.ko "path=/tmp/memory.lime format=lime"

# /dev/mem (limited)
sudo dd if=/dev/mem of=memory.raw bs=1M

# /proc/kcore
sudo cp /proc/kcore memory.elf
```

## macOS

```bash
sudo ./osxpmem -o memory.raw
```

## Virtualized Environments

```bash
# VMware
cp vm.vmem memory.raw

# VirtualBox
vboxmanage debugvm "VMName" dumpvmcore --filename memory.elf

# QEMU/KVM
virsh dump <domain> memory.raw --memory-only
```

## Volatility 3 Setup

```bash
pip install volatility3
vol -f memory.raw <plugin>
vol -f memory.raw -s /path/to/symbols windows.pslist
```

## Core Plugin Set

## Process Analysis

```bash
vol -f memory.raw windows.pslist
vol -f memory.raw windows.pstree
vol -f memory.raw windows.psscan
vol -f memory.raw windows.cmdline
vol -f memory.raw windows.envars --pid <PID>
```

## Network Analysis

```bash
vol -f memory.raw windows.netscan
vol -f memory.raw windows.netstat
```

## Modules / DLLs

```bash
vol -f memory.raw windows.dlllist --pid <PID>
vol -f memory.raw windows.ldrmodules
vol -f memory.raw windows.modules
vol -f memory.raw windows.moddump --pid <PID>
```

## Injection / Suspicious Regions

```bash
vol -f memory.raw windows.malfind
vol -f memory.raw windows.vadinfo --pid <PID>
vol -f memory.raw windows.vadyarascan --yara-rules rules.yar
```

## Registry / Persistence

```bash
vol -f memory.raw windows.registry.hivelist
vol -f memory.raw windows.registry.printkey --key "Software\Microsoft\Windows\CurrentVersion\Run"
vol -f memory.raw windows.svcscan
```

## File Artifacts

```bash
vol -f memory.raw windows.filescan
vol -f memory.raw windows.dumpfiles --pid <PID>
vol -f memory.raw windows.mftscan
```

## Linux Plugins

```bash
vol -f memory.raw linux.pslist
vol -f memory.raw linux.pstree
vol -f memory.raw linux.bash
vol -f memory.raw linux.sockstat
vol -f memory.raw linux.lsmod
vol -f memory.raw linux.mount
```

## macOS Plugins

```bash
vol -f memory.raw mac.pslist
vol -f memory.raw mac.pstree
vol -f memory.raw mac.netstat
vol -f memory.raw mac.lsmod
```

## Malware Triage Workflow

```bash
# 1. Baseline process view
vol -f memory.raw windows.pstree > processes.txt
vol -f memory.raw windows.pslist > pslist.txt

# 2. Network activity
vol -f memory.raw windows.netscan > network.txt

# 3. Injection hunting
vol -f memory.raw windows.malfind > malfind.txt

# 4. Deep dive candidate PID
vol -f memory.raw windows.dlllist --pid <PID>
vol -f memory.raw windows.handles --pid <PID>

# 5. Dump memory/objects
vol -f memory.raw windows.memmap --pid <PID> --dump

# 6. String extraction
strings -a pid.<PID>.dmp > strings.txt

# 7. YARA scan
vol -f memory.raw windows.yarascan --yara-rules malware.yar
```

## IR-Oriented Workflow

```bash
vol -f memory.raw windows.timeliner > timeline.csv
vol -f memory.raw windows.cmdline
vol -f memory.raw windows.consoles
vol -f memory.raw windows.registry.printkey --key "Software\Microsoft\Windows\CurrentVersion\Run"
vol -f memory.raw windows.scheduled_tasks
```

## Detection Heuristics

- Compare `pslist` vs `psscan` for hidden process indicators.
- Prioritize `PAGE_EXECUTE_READWRITE` VAD regions with anomalous headers/patterns.
- Inspect parent/child lineage anomalies in `pstree`.
- Correlate suspicious process with active outbound network from `netscan`.

## Rootkit-Oriented Checks

```bash
vol -f memory.raw windows.pslist > pslist.txt
vol -f memory.raw windows.psscan > psscan.txt
diff pslist.txt psscan.txt

vol -f memory.raw windows.callbacks
vol -f memory.raw windows.ssdt
vol -f memory.raw windows.driverscan
vol -f memory.raw windows.driverirp
```

## Credential/Secret Extraction Plugins (Authorized Use Only)

```bash
vol -f memory.raw windows.hashdump
vol -f memory.raw windows.lsadump
vol -f memory.raw windows.cachedump
```

Use only within legal authorization and incident scope.

## YARA Example

```yara
rule Suspicious_Injection {
  strings:
    $mz = { 4D 5A }
    $shell = { 55 8B EC 83 EC }
  condition:
    $mz at 0 or $shell
}
```

Run:

```bash
vol -f memory.raw windows.yarascan --yara-rules rules.yar
vol -f memory.raw windows.yarascan --yara-rules rules.yar --pid 1234
vol -f memory.raw windows.yarascan --yara-rules rules.yar --kernel
```

## Strings and Obfuscation

```bash
strings -a memory.raw > all_strings.txt
strings -el memory.raw >> all_strings.txt
grep -E "(https?://|[0-9]{1,3}(\.[0-9]{1,3}){3})" all_strings.txt

floss pid.1234.dmp
```

## Best Practices

1. Minimize acquisition footprint.
2. Record timestamp/tool/operator/host context.
3. Hash evidence immediately.
4. Maintain chain of custody.
5. Start broad, then deep-dive.
6. Cross-validate findings with multiple plugins.
7. Correlate memory with endpoint/network logs.
8. Document confidence and limitations.

## Common Pitfalls

- Stale captures or delayed acquisition
- Incomplete dump size vs expected RAM
- Wrong symbol tables/profile assumptions
- Smear effects during acquisition
- Encrypted/protected memory regions interpreted as benign noise

---
name: memory-forensics
description: Master memory forensics techniques including memory acquisition, process analysis, and artifact extraction using Volatility and related tools. Use when analyzing memory dumps, investigating incidents, or performing malware analysis from RAM captures.
---

# Memory Forensics

Purpose: acquire and analyze RAM artifacts for incident response and malware investigation.

## Use When

- Incident response with volatile evidence needs
- Suspected malware/process injection/rootkit activity
- Need process/network/registry state at incident time

## Don’t Use When

- You only need disk forensics
- You cannot preserve chain of custody requirements

## Workflow

1. **Acquire memory safely**
   - Use platform-appropriate tool; record method/time/hash.
2. **Validate evidence integrity**
   - Hash dump and preserve metadata/custody notes.
3. **Triage with Volatility**
   - Process tree, hidden process scan, network scan, cmdline/envars.
4. **Deep dive suspicious entities**
   - `malfind`, VAD, DLL/modules, handles, registry persistence keys.
5. **Extract and enrich artifacts**
   - Dump regions/files/process memory; strings/YARA/FLOSS.
6. **Correlate timeline**
   - Cross-check memory findings with host/network telemetry.
7. **Report findings + confidence**
   - Evidence path, commands used, indicators, limitations.

## Output Checklist

- [ ] Acquisition tool + command documented
- [ ] Memory image hash captured and preserved
- [ ] Volatility profile/symbol assumptions recorded
- [ ] Process, network, persistence triage completed
- [ ] Suspicious PID/module artifacts extracted
- [ ] YARA/string analysis run where relevant
- [ ] Findings correlated with external logs/timeline
- [ ] False-positive risks and analysis caveats noted

## Key Guardrails

- Minimize acquisition footprint
- Don’t alter original evidence; work on copies
- Expect smear/staleness and call out uncertainty
- Verify symbol compatibility before conclusions

## Resources

- Full guide: `references/full-guide.md`

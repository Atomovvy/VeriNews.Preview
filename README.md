# VeriNews Preview

Public, presentation-only staging repository for VeriNews.

Current live preview exercises the M5B.5 Minimum Publication Gate + Reader Experience candidate from:

```text
source_repository = Atomovvy/VeriNews.Dev
source_pr = #9
source_commit = 23a29d67a17f5eb4cc5f10e1c130b59f4dd5f040
preview_branch = agent/publish-preview-v01
```

The staging adapter keeps all three pilot cards visible so publication-state behavior can be evaluated. `REVIEW_REQUIRED` material remains hard-blocked and cannot be unlocked by reader preferences.

This repository contains only public preview/presentation output. Development policy, schemas, validators, private workflow documentation and working evidence data remain in the private authoritative `.Dev` repository.

The Preview branch is for product validation only and is not the production source of truth.

# VeriNews Preview

Public, presentation-only staging repository for VeriNews.

Current live preview exercises the M5B.5 Minimum Publication Gate + Reader Experience with four public presentation cards, including the Task 001 Morning Brief publication pilot from:

```text
source_repository = Atomovvy/VeriNews.Dev
source_pr = #40
source_commit = a9780a2f712a8f8692ce7c1b638c035cfa5a682f
preview_branch = agent/publish-preview-v01
```

The staging adapter keeps the existing reader experience intact while allowing stories from more than one publication date. `REVIEW_REQUIRED` material remains hard-blocked and cannot be unlocked by reader preferences.

Reader controls under review remain local-only age selection, unreviewed-material disclosure, per-item reveal, shared light/dark theme and PL/EN switching.

This repository contains only public preview/presentation output. Development policy, schemas, validators, private workflow documentation and working evidence data remain in the private authoritative `.Dev` repository.

The Preview branch is for product validation only and is not the production source of truth.

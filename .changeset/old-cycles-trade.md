---
'@graphql-yoga/common': patch
---

Since 2.8.0, Yoga stopped accepting POST requests if they don't have "Content-Type" header defined. But this was a breaking change for the existing users in a minor release. Now this has been reverted. Now it is safer to upgrade from 2.7.0 to the latest by skipping 2.8.0

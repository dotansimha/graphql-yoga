---
'graphql-yoga': patch
---

Restores compatibility with [RFC1341: The Multipart Content-Type](https://www.w3.org/Protocols/rfc1341/7_2_Multipart.html) by include preceding `\r\n` for initial boundary delimiter when using the multipart response protocol.

This makes Yoga compatible with libraries that strictly follow the response protocol, such as [fetch-multipart-graphql](https://github.com/relay-tools/fetch-multipart-graphql).

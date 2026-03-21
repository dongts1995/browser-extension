1. Open Chrome

2. Go:

```
chrome://extensions/
```

3. On Developer Mode

4. Click Load unpacked

5. Select dist folder


Socket install:

npm install socket.io-client@4.7.2
npm install -D @types/socket.io-client

tsconfig:
    moduleResolution: "node"
    esModuleInterop: true
    allowSyntheticDefaultImports: true

import io from "socket.io-client"; in socketService.ts.

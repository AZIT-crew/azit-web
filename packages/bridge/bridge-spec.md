# AZIT Bridge 스펙

> 자동 생성 파일 — `pnpm --filter @azit/bridge generate:spec`로 재생성

---

## 프로토콜 메시지 포맷

### Web → Native (request)

```json
{ "type": "request", "method": "<string>", "args": [...], "id": "<uuid>" }
```

### Native → Web (response)

```json
// 성공
{ "type": "response", "id": "<uuid>", "result": <unknown> }
// 실패
{ "type": "response", "id": "<uuid>", "error": "<string>" }
```

### Native → Web (event)

```json
{ "type": "event", "event": "<string>", "payload": <unknown> }
```

---

## AppBridge 메서드

| 메서드                        | 인자                                        | 반환 타입                                          | 설명                              |
| ----------------------------- | ------------------------------------------- | -------------------------------------------------- | --------------------------------- | ----------------------------------------------- | ------------------- |
| `openExternalBrowser`         | `url: string`                               | `Promise<void>`                                    | 외부 브라우저로 URL을 열기        |
| `shareInviteCode`             | `code: string, crewName: string`            | `Promise<void>`                                    | 초대 코드 공유                    |
| `shareSchedule`               | `scheduleId: string`                        | `Promise<void>`                                    | 일정 공유                         |
| `openNaverMap`                | `address: string, lat: number, lng: number` | `Promise<void>`                                    | 네이버 지도 앱으로 위치 열기      |
| `getCurrentPosition`          | `(없음)`                                    | `Promise<{ latitude: number; longitude: number }>` | 현재 GPS 위치 조회                |
| `getLocationPermissionStatus` | `(없음)`                                    | `Promise<'granted'                                 | 'denied'                          | 'undetermined'>`                                | 위치 권한 상태 조회 |
| `openLocationSettings`        | `(없음)`                                    | `Promise<void>`                                    | 위치 설정 화면 열기               |
| `socialLogin`                 | `type: 'kakao'                              | 'apple'`                                           | `Promise<SocialAuthResult>`       | 소셜 로그인 — Native SDK 실행 후 인증 정보 반환 |
| `pickProfileImage`            | `source: 'camera'                           | 'library'`                                         | `Promise<ImagePickerResult>`      | 카메라 또는 갤러리에서 프로필 이미지 선택       |
| `getAppVersion`               | `(없음)`                                    | `Promise<string>`                                  | 앱 버전 문자열 반환 (예: "1.0.0") |

### SocialAuthResult 타입

```ts
type SocialAuthResult =
  | { success: true; authorizationCode?: string; accessToken?: string }
  | { success: false; message: string };
```

### ImagePickerResult 타입

```ts
type ImagePickerResult =
  | { success: true; base64: string; fileName: string; mimeType: string }
  | { success: false; message: string };
```

---

## BRIDGE_EVENT 상수

현재 정의된 이벤트 없음.

---

## 플랫폼별 구현 가이드

### iOS — WKScriptMessageHandler (Swift)

```swift
// WKWebViewConfiguration 설정
let config = WKWebViewConfiguration()
let contentController = WKUserContentController()
contentController.add(self, name: "bridge")
config.userContentController = contentController

// 메시지 수신 처리
func userContentController(_ userContentController: WKUserContentController,
                            didReceive message: WKScriptMessage) {
    guard message.name == "bridge",
          let body = message.body as? String,
          let data = body.data(using: .utf8),
          let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
          let type = json["type"] as? String, type == "request",
          let method = json["method"] as? String,
          let id = json["id"] as? String
    else { return }

    let args = json["args"] as? [Any] ?? []
    // 메서드 디스패치 후 응답 전송
    let response: [String: Any] = ["type": "response", "id": id, "result": ...]
    let responseJson = String(data: try! JSONSerialization.data(withJSONObject: response), encoding: .utf8)!
    let js = "window.dispatchEvent(new MessageEvent('message', { data: \(responseJson.debugDescription) }));"
    webView.evaluateJavaScript(js)
}
```

### Android — WebViewClient (Kotlin)

```kotlin
webView.addJavascriptInterface(object : Any() {
    @JavascriptInterface
    fun postMessage(message: String) {
        val json = JSONObject(message)
        if (json.getString("type") != "request") return
        val method = json.getString("method")
        val id = json.getString("id")
        val args = json.getJSONArray("args")

        // 메서드 디스패치 후 응답 전송
        val result = dispatch(method, args)
        val response = JSONObject()
        response.put("type", "response")
        response.put("id", id)
        response.put("result", result)
        val js = "window.dispatchEvent(new MessageEvent('message', { data: ${JSONObject.quote(response.toString())} }));"
        runOnUiThread { webView.evaluateJavascript(js, null) }
    }
}, "ReactNativeWebView")
```

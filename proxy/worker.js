// 식품안전나라 OPEN API 프록시 (Cloudflare Worker)
//
// 식품안전나라가 해외 IP를 차단하므로, GitHub Actions → 이 Worker → 식약처 경로로 우회한다.
// PROXY_TOKEN 환경변수를 설정하면 x-proxy-token 헤더가 일치하는 요청만 통과시킨다.
//
// 배포 방법은 저장소 README의 "Cloudflare 프록시" 절 참고.

export default {
  async fetch(request, env) {
    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }
    if (env.PROXY_TOKEN && request.headers.get("x-proxy-token") !== env.PROXY_TOKEN) {
      return new Response("Unauthorized", { status: 401 });
    }
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) {
      return new Response("Not found", { status: 404 });
    }
    try {
      const upstream = await fetch(`http://openapi.foodsafetykorea.go.kr${url.pathname}`, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
          Accept: "application/json,text/html;q=0.9,*/*;q=0.8",
        },
        cf: { cacheTtl: 0 },
      });
      return new Response(upstream.body, {
        status: upstream.status,
        headers: {
          "content-type": upstream.headers.get("content-type") ?? "application/json; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    } catch (err) {
      return new Response(`Upstream error: ${err?.message ?? err}`, { status: 502 });
    }
  },
};

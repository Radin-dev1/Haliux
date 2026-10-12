/** @type {import('next').NextConfig} */
const config = {
  async headers() {
    return [{ source: "/(.*)", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  }
};
export default config;

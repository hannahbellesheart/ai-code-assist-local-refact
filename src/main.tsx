/**
 * Only used by the dev server
 */

import { render } from "./lib";

const element = document.getElementById("refact-chat");

if (element) {
  render(element, { host: "web", features: { statistics: false } });
}

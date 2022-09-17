import { dump } from "js-yaml";

export function comments(route, indent = 0) {
  const prefix = `${" ".repeat(indent)}//`;
  const items = {
    "req.headers": route.schema.headers,
    "req.params": route.schema.params,
    "req.query": route.schema.querystring,
    "req.body": route.schema.body,
    "valid responses": route.openapiSource.responses,
  };

  const commentize = (label) => {
    const data = items[label];
    if (!data) return "";
    const dataStrings = dump(data).split("\n");
    return `${prefix} ${label}
${dataStrings
  .map((item) => (item.length > 0 ? `${prefix}   ${item}` : prefix))
  .join("\n")}
`;
  };

  return Object.keys(items).reduce((acc, label) => acc + commentize(label), "");
}

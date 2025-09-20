// https://observablehq.com/@mbostock/file-input-with-initial-value@56
function _1(md){return(
md`# File Input with Initial Value

<p style="background: #fffced; box-sizing: border-box; padding: 10px 20px;">***Update Aug. 2021:*** *Please see my newer [**LocalFile input**](/@mbostock/localfile) which supports the full Observable [FileAttachment API](/@observablehq/file-attachments)! This notebook will remain for history, but is no longer supported.*</p>

This [file input](/@mbostock/reading-local-files) lets you specify a default value. To use in your notebook:

\`\`\`js
import {fileInput} from "@mbostock/file-input-with-initial-value"
\`\`\`

Ref. [@john-guerra](/@john-guerra/file-input-with-default-value)`
)}

function _file(fileInput,FileAttachment){return(
fileInput({
  initialValue: FileAttachment("hello.json").blob(),
  accept: ".json"
})
)}

function _3(file){return(
file
)}

async function _data(Files,file){return(
JSON.parse(await Files.text(file))
)}

function _fileInput(html){return(
function fileInput({initialValue, accept = ""} = {}) {
  const form = html`<form><input name=i type="file" accept="${accept}">`;
  form.i.onchange = () => {
    form.value = form.i.multiple ? form.i.files : form.i.files[0];
    form.dispatchEvent(new CustomEvent("input"));
  };
  form.value = initialValue;
  return form;
}
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["hello.json", {url: new URL("./files/6a80819bbb03fb04c43c7e6e88dde373d5b842b94c8e37cf53837e41d101812745e6cc131cfd96cdabb2088cb02b7a643bfd5c4b97db96f863119b5da7dd3324.json", import.meta.url), mimeType: "application/json", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("viewof file")).define("viewof file", ["fileInput","FileAttachment"], _file);
  main.variable(observer("file")).define("file", ["Generators", "viewof file"], (G, _) => G.input(_));
  main.variable(observer()).define(["file"], _3);
  main.variable(observer("data")).define("data", ["Files","file"], _data);
  main.variable(observer("fileInput")).define("fileInput", ["html"], _fileInput);
  return main;
}

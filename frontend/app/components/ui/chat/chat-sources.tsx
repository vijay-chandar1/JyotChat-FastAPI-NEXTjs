import { ArrowUpRightSquare, Check, Copy } from "lucide-react";
import { useMemo } from "react";
import { Button } from "../button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../hover-card";
import { SourceData, SourceNode } from "./index";
import { useCopyToClipboard } from "./use-copy-to-clipboard";

const SCORE_THRESHOLD = 0.5;

export function ChatSources({ data }: { data: SourceData }) {
  const sources = useMemo(() => {
    return (
      data.nodes
        ?.filter((node) => Object.keys(node.metadata).length > 0)
        ?.filter((node) => (node.score ?? 1) > SCORE_THRESHOLD)
        .sort((a, b) => (b.score ?? 1) - (a.score ?? 1)) || []
    );
  }, [data.nodes]);

  if (sources.length === 0) return null;

  return (
    <div className="space-x-2 text-sm">
      <span className="font-semibold">Sources:</span>
      <div className="inline-flex gap-1 items-center">
        {sources.map((node: SourceNode, index: number) => (
          <div key={node.id}>
            <HoverCard>
              <HoverCardTrigger>
                <div className="text-xs w-5 h-5 rounded-full bg-gray-100 mb-2 flex items-center justify-center hover:text-white hover:bg-primary hover:cursor-pointer">
                  {index + 1}
                </div>
              </HoverCardTrigger>
              <HoverCardContent>
                <NodeInfo node={node} />
              </HoverCardContent>
            </HoverCard>
          </div>
        ))}
      </div>
    </div>
  );
}

function NodeInfo({ node }: { node: SourceNode }) {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 1000 });

  if (typeof node.metadata["URL"] === "string") {
    // this is a node generated by the web loader, it contains an external URL
    // add a link to view this URL
    return (
      <a
        className="space-x-2 flex items-center my-2 hover:text-blue-900"
        href={node.metadata["URL"]}
        target="_blank"
      >
        <span>{node.metadata["URL"]}</span>
        <ArrowUpRightSquare className="w-4 h-4" />
      </a>
    );
  }
  // if (typeof node.metadata["page_label"] === "string") { 
  //     let pageLabel = node.metadata["page_label"];
  // }
  // if (typeof node.metadata["file_path"] === "string") {
  //   // this is a node generated by the file loader, it contains file path
  //   // add a button to copy the path to the clipboard
  //   const filePath = node.metadata["file_path"];
  const path = require('path');

  if (typeof node.metadata["file_path"] === "string") {
      // this is a node generated by the file loader, it contains file path
      let filePath = node.metadata["file_path"];
      // replace backslashes with forward slashes for path module compatibility
      filePath = filePath.replace(/\\/g, "/");
      // get the base name of the file path (file name + extension)
      filePath = path.basename(filePath);
      // remove the extension from the file name
      filePath = path.parse(filePath).name;

      let pageLabel = "";
      if (typeof node.metadata["page_label"] === "string") { 
        pageLabel = node.metadata["page_label"];
      }
    return (
      <div className="flex items-center px-2 py-1 justify-between my-2">
        <a
    href={filePath.startsWith("http") ? `${filePath}#page=${pageLabel}` : `https://stljyot1.blob.core.windows.net/stl-jyot-ai-resources/pdfs/${filePath}.pdf#page=${pageLabel}`}
    target="_blank"
    style={{ color: 'black', cursor: 'pointer', textDecoration: 'none' }}
    onMouseOver={(e) => (e.target as HTMLElement).style.color = 'grey'}
    onMouseOut={(e) => (e.target as HTMLElement).style.color = 'black'}
  >
    {filePath} (Page: {pageLabel})
  </a>
        <Button
          onClick={() => copyToClipboard(filePath.startsWith("http") ? `${filePath}#page=${pageLabel}` : `https://stljyot1.blob.core.windows.net/stl-jyot-ai-resources/pdfs/${filePath}.pdf#page=${pageLabel}`)}
          size="icon"
          variant="ghost"
          className="h-12 w-12"
        >
          {isCopied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    );
  }

  // node generated by unknown loader, implement renderer by analyzing logged out metadata
  console.log("Node metadata", node.metadata);
  return (
    <p>
      Sorry, unknown node type. Please add a new renderer in the NodeInfo
      component.
    </p>
  );
}

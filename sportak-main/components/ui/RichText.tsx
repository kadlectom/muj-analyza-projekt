import { Fragment } from "react"
import { parseRichText, type Block, type Inline } from "@/lib/richText"

export function RichText({ source }: { source: string }) {
  const blocks = parseRichText(source)
  if (blocks.length === 0) return null
  return (
    <div className="space-y-3">
      {blocks.map((block, i) => (
        <Fragment key={i}>{renderBlock(block, i)}</Fragment>
      ))}
    </div>
  )
}

function renderBlock(block: Block, key: number): JSX.Element {
  if (block.type === "paragraph") {
    return <p>{renderInlines(block.inlines, `b${key}`)}</p>
  }
  return (
    <ul className="list-disc pl-5 space-y-1">
      {block.items.map((item, i) => (
        <li key={i}>{renderInlines(item, `b${key}-l${i}`)}</li>
      ))}
    </ul>
  )
}

function renderInlines(inlines: Inline[], keyPrefix: string): React.ReactNode[] {
  return inlines.map((node, i) => {
    const k = `${keyPrefix}-${i}`
    if (node.type === "text") return <Fragment key={k}>{node.text}</Fragment>
    if (node.type === "br") return <br key={k} />
    if (node.type === "bold") {
      return <strong key={k} className="font-bold">{renderInlines(node.children, k)}</strong>
    }
    if (node.type === "italic") {
      return <em key={k} className="italic">{renderInlines(node.children, k)}</em>
    }
    return (
      <a
        key={k}
        href={node.href}
        target="_blank"
        rel="noreferrer noopener"
        className="text-blue underline hover:no-underline"
      >
        {renderInlines(node.children, k)}
      </a>
    )
  })
}

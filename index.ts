import { namedTypes as n, builders as b } from 'ast-types'
import * as k from 'ast-types/gen/kinds'
import { JSDOM } from 'jsdom'
import {generate} from 'escodegen'

const dom = new JSDOM(`outside<div class="test">outer<div>middle<div>inside</div></div></div>`)

const Node = dom.window.Node

function visitBody(node: Node): n.Program {
  const components = Array.from(node.childNodes).map(visit)
  return b.program([
    b.expressionStatement(b.literal('use strict')),
    b.expressionStatement(b.callExpression(
      b.memberExpression(b.identifier('React'), b.identifier('createElement')),
      [
        b.memberExpression(b.identifier('React'), b.identifier('fragment')),
        b.literal(null),
        ...components,
      ]
    ),
    )
  ])
}

function visitAttribute(attr: Attr): n.Property {
  return b.property('init', b.literal(attr.name), b.literal(attr.value))
}

function visitElement(node: Node): k.ExpressionKind {
  const childComponents = Array.from(node.childNodes).map(visit)
  const attributes = Array.from((node as Element).attributes).map(visitAttribute)
  return b.callExpression(
    b.memberExpression(b.identifier('React'), b.identifier('createElement')),
    [
      b.literal(node.nodeName.toLowerCase()),
      attributes.length > 0 ? b.objectExpression(attributes) : b.literal(null),
      ...childComponents
    ]
  )
}

function visitText(node: Node): k.ExpressionKind {
  return b.literal(node.nodeValue)
}

function visit(node: Node): k.ExpressionKind {
  switch(node.nodeType) {
    case Node.ELEMENT_NODE:
      return visitElement(node)
    case Node.TEXT_NODE:
      return visitText(node)
    default:
      throw new Error(`Unsupported node type ${node.nodeType}`)
  }
}

const result = visitBody(dom.window.document.body)
console.log(
  generate(result, {
    format: {
      semicolons: false,
    }
  })
)

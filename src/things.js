import { visit, parse as gql, Kind, } from 'graphql'

import {
  hasField,
  createField,

} from './helpers'

const connectionFields = [ 'edges', 'pageInfo', ]

export const things = (
  useConnections,
  idKey = 'id',
) => {
  const hasIdField = hasField(idKey)
  const hasTypeNameField = hasField('__typename')
  const hasEdgesField = hasField('edges')

  const idField = createField(idKey)
  const typeNameField = createField('__typename')

  const excludeMetaFields = useConnections
    ? (node, key, parent, path) =>
      hasEdgesField(node.selections) ||
      connectionFields.includes(parent.name.value)
    : () => false

  function addRequiredFields (query) {
    return visit(query, {
      SelectionSet (node, key, parent, path) {
        if (
          parent.kind === Kind.OPERATION_DEFINITION ||
        excludeMetaFields(node, key, parent, path)
        ) {
          return
        }

        !hasIdField(node.selections) && node.selections.unshift(idField)
        !hasTypeNameField(node.selections) &&
        node.selections.unshift(typeNameField)

        return node
      },
    })
  }

  function parse (qs) {
    return addRequiredFields(gql(qs, { noLocation: true, }))
  }

  return { parse, addRequiredFields, }
}

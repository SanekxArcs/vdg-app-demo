import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'pieceType',
  title: 'Piece Type',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string' }),
  ],
});
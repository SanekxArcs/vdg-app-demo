import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'typ',
  title: 'Typ',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string' }),
    defineField({ name: 'description', title: 'Description', type: 'string' }),
  ],
})
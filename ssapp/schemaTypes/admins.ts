import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'admins',
  title: 'Admins',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string' ,
      description: 'Admin name'}),
  ],
})
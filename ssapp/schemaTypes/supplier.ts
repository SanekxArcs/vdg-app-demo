import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'supplier',
  title: 'Supplier',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string' }),
  ],
});
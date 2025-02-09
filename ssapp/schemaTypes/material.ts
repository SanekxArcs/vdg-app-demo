import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'material',
  title: 'Material',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
    }),
    defineField({
      name: 'shopName',
      title: 'Shop Name',
      type: 'string',
      description: 'Name of the shop where the material was bought',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
    defineField({
      name: 'quantity',
      title: 'Quantity',
      initialValue: 0,
      type: 'number',
    }),
    defineField({
      name: 'pieces',
      title: 'Pieces',
      description: 'Number of pieces/m in the material, for calculation purposes',
      initialValue: 1,
      type: 'number',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'unit',
      title: 'Unit',
      type: 'reference',
      to: [{type: 'pieceType'}],
    }),
    defineField({
      name: 'priceNetto',
      title: 'Price Netto',
      type: 'number',
    }),

    defineField({
      name: 'supplier',
      title: 'Supplier',
      type: 'reference',
      to: [{type: 'supplier'}],
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      description: 'URL of the item in the shop',
    }),

    defineField({
      name: 'category',
      title: 'Category',
      description: 'Material category',
      type: 'reference',
      to: [{type: 'category'}],
    }),
    defineField({
      name: 'minQuantity',
      title: 'Minimum Quantity',
      description: 'Minimum quantity of material',
      initialValue: 5,
      type: 'number',
    }),
    defineField({
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      readOnly: true,
    }),
    defineField({
      name: 'updatedAt',
      title: 'Updated At',
      type: 'datetime',
      readOnly: true,
    }),
  ],
})

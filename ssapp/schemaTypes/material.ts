import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'material',
  title: 'Material',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string'}),
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
      required: true,
      type: 'number',
    }),
    defineField({
      name: 'unit',
      title: 'Unit',
      type: 'reference', 
      to: [{type: 'pieceType'}]
    }),
    defineField({name: 'priceNetto', title: 'Price Netto', type: 'number'}),
    
    defineField({
      name: 'supplier',
      title: 'Supplier',
      type: 'reference', 
      to: [{type: 'supplier'}]
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
  initialValue: () => new Date().toISOString(), // Auto-set to current date & time
  readOnly: true, // Prevent manual editing
}),
    defineField({name: 'updatedAt', title: 'Updated At', type: 'datetime'}),
  ],
})

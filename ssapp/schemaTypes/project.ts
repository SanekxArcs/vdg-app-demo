import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    defineField({name: 'number', title: 'MPK', type: 'number'}),
    defineField({name: 'city', title: 'City', type: 'string'}),
    defineField({name: 'adress', title: 'Address', type: 'string'}),
    defineField({
      name: 'postal',
      title: 'Postal Code',
      type: 'string',
      validation: (Rule) =>
        Rule.regex(/^[0-9]{2}-[0-9]{3}$/, {
          name: 'Polish postal code format (00-000)',
        }),
    }),
    defineField({name: 'idq', title: 'Firm Code', type: 'number'}),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'reference',
      to: [{type: 'typ'}],
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'reference',
      to: [{type: 'status'}],
    }),
    defineField({
      name: 'firms',
      title: 'Firm',
      type: 'reference',
      to: [{type: 'firm'}],
    }),
    defineField({name: 'startDate', title: 'Start Date', type: 'datetime'}),
    defineField({name: 'endDate', title: 'End Date', type: 'datetime'}),
    defineField({
      name: 'deadlineDate',
      title: 'Deadline Date',
      type: 'datetime',
    }),
    defineField({
      name: 'ekipa',
      title: 'Ekipa',
      type: 'reference',
      to: [{type: 'ekipa'}],
    }),
    defineField({
      name: 'totalBudget',
      title: 'Total Budget',
      type: 'number',
      readOnly: true,
      description:
        'Calculated as (quantity/pieces) * price for each material plus other added materials',
    }),
    defineField({
      name: 'materials',
      title: 'Materials',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'material',
              title: 'Material',
              type: 'reference',
              to: [{type: 'material'}],
            },
            {
              name: 'quantity',
              title: 'Quantity',
              type: 'number',
            },
          ],
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'price',
    },
    prepare(selection) {
      return {
        title: selection.title,
        subtitle: `Price: ${selection.subtitle || 'N/A'}`,
      }
    },
  },
})
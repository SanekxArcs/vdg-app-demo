// schemas/project.js
import {defineType, defineField} from 'sanity'
import { nanoid } from 'nanoid';

export default defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    // Unique project number or code
    defineField({
      name: 'number',
      title: 'MPK',
      type: 'number',
      description: 'Unique project number or code',
    }),

    // Basic location data
    defineField({
      name: 'city',
      title: 'City',
      type: 'string',
    }),
    defineField({
      name: 'address',
      title: 'Address',
      type: 'string',
    }),
    defineField({
      name: 'postal',
      title: 'Postal Code',
      type: 'string',
      validation: (Rule) =>
        Rule.regex(/^[0-9]{2}-[0-9]{3}$/, {
          name: 'Polish postal code format (00-000)',
        }),
    }),

    // Firm or client code
    defineField({
      name: 'idq',
      title: 'Firm Code',
      type: 'number',
      description: 'ID reference for the firm/client',
    }),
    // Description of the project
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Short description of the project',
    }),

    // link to project  online disc
    defineField({
      name: 'link',
      title: 'Link',
      type: 'url',
      description: 'Link to the project online disc',
    }),

    // Reference fields
    defineField({
      name: 'type',
      title: 'Type',
      type: 'reference',
      to: [{type: 'typ'}],
      description: 'Type/category of project',
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'reference',
      to: [{type: 'status'}],
      description: 'Current status of the project',
    }),
    defineField({
      name: 'firm',
      title: 'Firm',
      type: 'reference',
      to: [{type: 'firms'}],
      description: 'Reference to the firm this project belongs to',
    }),

    // Dates
    defineField({
      name: 'startDate',
      title: 'Start Date',
      type: 'datetime',
    }),
    defineField({
      name: 'endDate',
      title: 'End Date',
      type: 'datetime',
    }),
    defineField({
      name: 'deadlineDate',
      title: 'Deadline Date',
      type: 'datetime',
    }),

    // Optional project team / crew
    defineField({
      name: 'ekipa',
      title: 'Ekipa',
      type: 'reference',
      to: [{type: 'ekipa'}],
    }),

    // Materials used in this project
    defineField({
      name: 'materials',
      title: 'Materials',
      type: 'array',
      of: [
        defineField({
          name: 'usedMaterial',
          title: 'Used Material',
          type: 'object',
          fields: [
            {
              name: 'material',
              title: 'Material',
              type: 'reference',
              to: [{type: 'material'}],
              description: 'Link to an existing material in the database',
            },
            {
              name: 'quantity',
              title: 'Quantity',
              type: 'number',
              initialValue: 0,
              description: 'Quantity of this material used for the project',
            },
            {
              name: 'id',
              title: 'ID',
              type: 'string',
              description: 'Unique ID for this material',
              initialValue: () => nanoid(), // Generate unique ID on creation
              readOnly: true, // Optional: prevent manual editing
              validation: (Rule) => Rule.required(), // Optional: ensure ID exists
            },
          ],
        }),
      ],
      description: 'List of materials and their quantities for this project',
    }),

    // Timeline or history of events for the project
    defineField({
      name: 'timeline',
      title: 'Timeline',
      type: 'array',
      of: [
        defineField({
          name: 'event',
          title: 'Event',
          type: 'object',
          fields: [
            {
              name: 'time',
              title: 'Time',
              type: 'datetime',
              description: 'When this event or update happened',
              initialValue: new Date().toISOString(),
            },
            //admins
            {
              name: 'author',
              title: 'Author',
              type: 'reference',
              to: [{type: 'admins'}],
              description: 'Author of this event or update',
            },
            {
              name: 'comment',
              title: 'Comment',
              type: 'text',
              description: 'Details or description of the event',
            },
          ],
        }),
      ],
      description: 'Chronological log of major steps, updates, or notes for this project',
    }),

    // Additional Costs
    defineField({
      name: 'additionalCosts',
      title: 'Additional Costs',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'description',
              title: 'Cost Description',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'amount',
              title: 'Amount',
              type: 'number',
              validation: (Rule) => Rule.min(0).required(),
            },
          ],
        },
      ],
    }),
    // totalCost
    defineField({
      name: 'totalBudget',
      title: 'Total Cost',
      description: 'Total budget for the project',
      type: 'number',
      readOnly: true,
    }),
  ],

  preview: {
    select: {
      title: 'number',
      subtitle: 'city',
    },
    prepare(selection) {
      const {title, subtitle} = selection
      return {
        subtitle: subtitle ? `MPK: ${subtitle}` : 'No MPK',
        title: title ? `MPK: ${title}` : 'No MPK',
      }
    },
  },
})

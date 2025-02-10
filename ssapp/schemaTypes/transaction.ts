export default {
  name: 'transaction',
  title: 'Transaction',
  type: 'document',
  fields: [
    {
      name: 'description',
      title: 'Description',
      type: 'string',
    },
    {
      name: 'date',
      title: 'Date',
      type: 'datetime',
      options: {
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm',
      },
    },
    {
      name: 'amount',
      title: 'Amount',
      type: 'number',
    },
    {
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          {title: 'Expense', value: 'expense'},
          {title: 'Revenue', value: 'revenue'},
        ],
      },
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          {title: 'Supplies', value: 'supplies'},
          {title: 'Project', value: 'project'},
          {title: 'Salary', value: 'salary'},
          {title: 'Other', value: 'other'},
        ],
      },
    },
    {
      name: 'partner',
      title: 'Partner',
      type: 'reference',
      to: [{type: 'partner'}],
    },
  ],
}

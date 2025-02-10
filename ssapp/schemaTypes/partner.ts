export default {
  name: 'partner',
  title: 'Partner',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
    },
    {
      name: 'share',
      title: 'Share',
      type: 'number',
      description: 'Ownership percentage as a decimal (e.g., 0.4 for 40%)',
    },
  ],
}

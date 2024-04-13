// @ts-check

/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.schema.createTable('reports', table => {
    table.comment('Table containing Renovate reports');
    table
      .string('run_id')
      .notNullable()
      .unique()
      .comment('unique id of the run of a task');
    table
      .string('task_id')
      .notNullable()
      .comment('id of the Repository reoccurring task');
    table
      .timestamp('timestamp')
      .notNullable()
      .comment('Time when the report has been pushed');
    table
      .text('host')
      .notNullable()
      .comment('host of the git service e.g. github.com');
    table
      .text('repository')
      .notNullable()
      .comment(
        'organization or full group with repository e.g. "myOrg/myRepository" for github',
      );
    table
      .json('report')
      .notNullable()
      .comment('Report of this repository as JSON blob');
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTable('reports');
};

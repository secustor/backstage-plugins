// @ts-check

/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.schema.createTable('dependencies', table => {
    table.comment('Table containing found dependencies');
    table
      .uuid('id', { primaryKey: true })
      .comment('unique id of the dependency entry')
      .defaultTo(knex.fn.uuid());
    table
      .string('run_id')
      .notNullable()
      .comment('unique id to find source of the dependency');
    table.dateTime('extractionTimestamp').comment('Timestamp of the creation');
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
      .text('manager')
      .notNullable()
      .comment('Renovate manager which extracted the package');
    table.text('datasource').notNullable().comment('Datasource of the package');
    table.text('depName').notNullable().comment('Name of the package');
    table.text('packageName').comment('Name of the package');
    table
      .text('packageFile')
      .notNullable()
      .comment('File where the package is defined');
    table.text('depType').comment('Type of the dependency');
    table.text('currentValue').comment('Current value of the dependency');
    table.text('currentVersion').comment('Current version of the dependency');
    table
      .dateTime('currentVersionTimestamp')
      .comment('Timestamp of the current version');
    table.text('skipReason').comment('Reason why the dependency was skipped');
    table.text('registryUrl').comment('Registry URL of the package');
    table.text('sourceUrl').comment('Source URL of the package');

    table.index(['host', 'repository'], 'repositoryIndex');
    table.index(['host', 'repository', 'packageFile'], 'packageFileIndex');
    table.index(['datasource', 'depName'], 'packageIndex');
    table.index(['manager', 'depName'], 'packageIndex');
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTable('dependencies');
};

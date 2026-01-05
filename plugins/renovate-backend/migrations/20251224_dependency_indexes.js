// @ts-check

/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.schema.alterTable('dependencies', table => {
    table.index(['run_id'], 'runIdIndex');
    table.index(['extractionTimestamp'], 'extractionTimestampIndex');
    table.index(
      ['host', 'repository', 'extractionTimestamp'],
      'latestLookupIndex',
    );
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.alterTable('dependencies', table => {
    table.dropIndex(['run_id'], 'runIdIndex');
    table.dropIndex(['extractionTimestamp'], 'extractionTimestampIndex');
    table.dropIndex(
      ['host', 'repository', 'extractionTimestamp'],
      'latestLookupIndex',
    );
  });
};

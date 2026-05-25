const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  database: 'nbsn_db',
  user: 'postgres',
  password: 'postgres',
  port: 5432,
});

async function debugMarkingLearners() {
  const client = await pool.connect();
  try {
    // 1. List all projects
    console.log('=== PROJECTS ===');
    const projects = await client.query('SELECT id, project_name FROM projects ORDER BY id');
    projects.rows.forEach(p => console.log(`  Project ${p.id}: ${p.project_name}`));

    // 2. For each project, check the chain: project -> project_sites -> site_classes -> class_enrollments -> learners
    for (const project of projects.rows) {
      console.log(`\n=== Project: ${project.project_name} (ID: ${project.id}) ===`);

      const sites = await client.query(
        'SELECT id, site_name FROM project_sites WHERE project_id = $1',
        [project.id]
      );
      console.log(`  Sites: ${sites.rows.length}`);
      sites.rows.forEach(s => console.log(`    Site ${s.id}: ${s.site_name}`));

      const classes = await client.query(
        `SELECT sc.id, sc.class_name, sc.project_site_id 
         FROM site_classes sc 
         JOIN project_sites ps ON sc.project_site_id = ps.id 
         WHERE ps.project_id = $1`,
        [project.id]
      );
      console.log(`  Classes: ${classes.rows.length}`);
      classes.rows.forEach(c => console.log(`    Class ${c.id}: ${c.class_name} (site_id: ${c.project_site_id})`));

      const enrollments = await client.query(
        `SELECT ce.id, ce.learner_id, ce.site_class_id, l.first_name, l.last_name
         FROM class_enrollments ce
         JOIN site_classes sc ON ce.site_class_id = sc.id
         JOIN project_sites ps ON sc.project_site_id = ps.id
         JOIN learners l ON ce.learner_id = l.id
         WHERE ps.project_id = $1`,
        [project.id]
      );
      console.log(`  Enrollments (learners in classes): ${enrollments.rows.length}`);
      enrollments.rows.forEach(e => console.log(`    Learner ${e.learner_id}: ${e.first_name} ${e.last_name} (class_id: ${e.site_class_id})`));
    }

    // 3. Check total learners in DB
    console.log('\n=== ALL LEARNERS IN DB ===');
    const allLearners = await client.query('SELECT id, first_name, last_name, id_number FROM learners ORDER BY id LIMIT 20');
    console.log(`Total learners: ${allLearners.rows.length} (showing up to 20)`);
    allLearners.rows.forEach(l => console.log(`  Learner ${l.id}: ${l.first_name} ${l.last_name} (ID: ${l.id_number})`));

    // 4. Check class_enrollments table
    console.log('\n=== CLASS ENROLLMENTS ===');
    const allEnrollments = await client.query('SELECT COUNT(*) as count FROM class_enrollments');
    console.log(`Total enrollments: ${allEnrollments.rows[0].count}`);

    // 5. Check if learners are enrolled in classes but classes have no project_site_id
    console.log('\n=== CLASSES WITHOUT PROJECT SITE ===');
    const orphanClasses = await client.query(
      `SELECT sc.id, sc.class_name, sc.project_site_id 
       FROM site_classes sc 
       WHERE sc.project_site_id IS NULL`
    );
    console.log(`Classes without project_site: ${orphanClasses.rows.length}`);
    orphanClasses.rows.forEach(c => console.log(`  Class ${c.id}: ${c.class_name}`));

    // 6. Check all site_classes
    console.log('\n=== ALL SITE CLASSES ===');
    const allClasses = await client.query('SELECT id, class_name, project_site_id FROM site_classes ORDER BY id');
    allClasses.rows.forEach(c => console.log(`  Class ${c.id}: ${c.class_name} (project_site_id: ${c.project_site_id})`));

  } finally {
    client.release();
    await pool.end();
  }
}

debugMarkingLearners().catch(console.error);

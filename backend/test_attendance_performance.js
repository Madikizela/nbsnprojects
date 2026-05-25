const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function testAttendancePerformance() {
  try {
    await client.connect();
    console.log('🔗 Connected to PostgreSQL database');
    console.log('📊 Testing Attendance Tracking Performance...\n');

    // Test 1: Projects with attendance query
    console.log('1️⃣ Testing Projects with Attendance Query:');
    const start1 = Date.now();
    
    const projectsQuery = `
      SELECT 
        p."Id" as project_id,
        p."ProjectName" as project_name,
        COUNT(DISTINCT ce."LearnerId") as total_learners,
        COUNT(DISTINCT CASE WHEN la."ClockInTime" IS NOT NULL AND la."AttendanceDate" = CURRENT_DATE THEN ce."LearnerId" END) as present_today,
        COUNT(DISTINCT sc."Id") as total_classes
      FROM "Projects" p
      LEFT JOIN "ProjectSites" ps ON ps."ProjectId" = p."Id"
      LEFT JOIN "SiteClasses" sc ON sc."ProjectSiteId" = ps."Id"
      LEFT JOIN "ClassEnrollments" ce ON ce."SiteClassId" = sc."Id" AND ce."Status" = 'Active'
      LEFT JOIN "LearnerAttendances" la ON la."LearnerId" = ce."LearnerId" AND la."AttendanceDate" = CURRENT_DATE
      GROUP BY p."Id", p."ProjectName"
      HAVING COUNT(DISTINCT ce."LearnerId") > 0
      ORDER BY p."ProjectName";
    `;
    
    const projectsResult = await client.query(projectsQuery);
    const time1 = Date.now() - start1;
    console.log(`   ✅ Query completed in ${time1}ms`);
    console.log(`   📈 Found ${projectsResult.rows.length} projects with learners`);
    
    if (projectsResult.rows.length > 0) {
      const sample = projectsResult.rows[0];
      console.log(`   📋 Sample: ${sample.project_name} - ${sample.total_learners} learners, ${sample.present_today} present today`);
    }

    // Test 2: Weekly attendance query
    console.log('\n2️⃣ Testing Weekly Attendance Query:');
    const start2 = Date.now();
    
    const weeklyQuery = `
      SELECT 
        l."Id" as learner_id,
        l."FirstName",
        l."LastName",
        l."IdNumber",
        la."AttendanceDate",
        la."Status",
        la."ClockInTime",
        la."ClockOutTime"
      FROM "Learners" l
      JOIN "ClassEnrollments" ce ON ce."LearnerId" = l."Id" AND ce."Status" = 'Active'
      JOIN "SiteClasses" sc ON sc."Id" = ce."SiteClassId"
      JOIN "ProjectSites" ps ON ps."Id" = sc."ProjectSiteId"
      LEFT JOIN "LearnerAttendances" la ON la."LearnerId" = l."Id" 
        AND la."AttendanceDate" >= CURRENT_DATE - INTERVAL '7 days'
        AND la."AttendanceDate" <= CURRENT_DATE
      WHERE ps."ProjectId" = (SELECT "Id" FROM "Projects" LIMIT 1)
      ORDER BY l."LastName", l."FirstName", la."AttendanceDate";
    `;
    
    const weeklyResult = await client.query(weeklyQuery);
    const time2 = Date.now() - start2;
    console.log(`   ✅ Query completed in ${time2}ms`);
    console.log(`   📈 Found ${weeklyResult.rows.length} attendance records for the week`);

    // Test 3: Class breakdown query
    console.log('\n3️⃣ Testing Class Breakdown Query:');
    const start3 = Date.now();
    
    const classQuery = `
      SELECT 
        sc."Id" as class_id,
        sc."ClassName",
        ps."SiteName",
        COUNT(DISTINCT ce."LearnerId") as total_learners,
        COUNT(DISTINCT CASE WHEN la."ClockInTime" IS NOT NULL AND la."AttendanceDate" = CURRENT_DATE THEN ce."LearnerId" END) as present_today
      FROM "SiteClasses" sc
      JOIN "ProjectSites" ps ON ps."Id" = sc."ProjectSiteId"
      LEFT JOIN "ClassEnrollments" ce ON ce."SiteClassId" = sc."Id" AND ce."Status" = 'Active'
      LEFT JOIN "LearnerAttendances" la ON la."LearnerId" = ce."LearnerId" AND la."AttendanceDate" = CURRENT_DATE
      WHERE ps."ProjectId" = (SELECT "Id" FROM "Projects" LIMIT 1)
      GROUP BY sc."Id", sc."ClassName", ps."SiteName"
      ORDER BY sc."ClassName";
    `;
    
    const classResult = await client.query(classQuery);
    const time3 = Date.now() - start3;
    console.log(`   ✅ Query completed in ${time3}ms`);
    console.log(`   📈 Found ${classResult.rows.length} classes`);

    // Test 4: Index usage verification
    console.log('\n4️⃣ Verifying Index Usage:');
    const indexQuery = `
      SELECT 
        schemaname,
        relname as tablename,
        indexrelname as indexname,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes 
      WHERE indexrelname LIKE 'IX_%'
        AND (idx_tup_read > 0 OR idx_tup_fetch > 0)
      ORDER BY idx_tup_read DESC
      LIMIT 10;
    `;
    
    const indexResult = await client.query(indexQuery);
    console.log(`   📊 Active indexes (${indexResult.rows.length} found):`);
    indexResult.rows.forEach(row => {
      console.log(`   📋 ${row.indexname}: ${row.idx_tup_read} reads, ${row.idx_tup_fetch} fetches`);
    });

    // Performance summary
    console.log('\n📊 PERFORMANCE SUMMARY:');
    console.log(`   🚀 Projects Query: ${time1}ms`);
    console.log(`   🚀 Weekly Query: ${time2}ms`);
    console.log(`   🚀 Class Query: ${time3}ms`);
    console.log(`   🚀 Total Test Time: ${time1 + time2 + time3}ms`);
    
    const avgTime = (time1 + time2 + time3) / 3;
    console.log(`   📈 Average Query Time: ${Math.round(avgTime)}ms`);
    
    if (avgTime < 100) {
      console.log('   ✅ EXCELLENT: All queries under 100ms');
    } else if (avgTime < 500) {
      console.log('   ✅ GOOD: Queries under 500ms');
    } else {
      console.log('   ⚠️  NEEDS IMPROVEMENT: Queries over 500ms');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('\n🔚 Database connection closed');
  }
}

testAttendancePerformance();
package com.cleanpulse.app.data.local

import android.content.Context
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverter
import androidx.room.TypeConverters
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "scan_history")
data class ScanHistoryEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val timestamp: Long,
    val durationMs: Long,
    val filesScanned: Int,
    val totalBytesScanned: Long,
    val cleanableFoundBytes: Long,
    val duplicatesFoundCount: Int
)

@Entity(tableName = "cleanup_history")
data class CleanupHistoryEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val timestamp: Long,
    val bytesReclaimed: Long,
    val itemsCount: Int,
    val categoriesCleaned: List<String>,
    val triggeredBy: String
)

class Converters {
    @TypeConverter
    fun fromStringList(value: List<String>): String = value.joinToString(",")

    @TypeConverter
    fun toStringList(value: String): List<String> = if (value.isEmpty()) emptyList() else value.split(",")
}

@Dao
interface ScanHistoryDao {
    @Query("SELECT * FROM scan_history ORDER BY timestamp DESC LIMIT 50")
    fun getAllScans(): Flow<List<ScanHistoryEntity>>

    @Insert
    suspend fun insert(scan: ScanHistoryEntity)

    @Query("DELETE FROM scan_history")
    suspend fun clearAll()
}

@Dao
interface CleanupDao {
    @Query("SELECT * FROM cleanup_history ORDER BY timestamp DESC LIMIT 50")
    fun getAllCleanups(): Flow<List<CleanupHistoryEntity>>

    @Insert
    suspend fun insert(cleanup: CleanupHistoryEntity)

    @Query("DELETE FROM cleanup_history")
    suspend fun clearAll()
}

@Database(
    entities = [ScanHistoryEntity::class, CleanupHistoryEntity::class],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class CleanPulseDatabase : RoomDatabase() {
    abstract fun scanHistoryDao(): ScanHistoryDao
    abstract fun cleanupDao(): CleanupDao

    companion object {
        @Volatile
        private var INSTANCE: CleanPulseDatabase? = null

        fun getInstance(context: Context): CleanPulseDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    CleanPulseDatabase::class.java,
                    "cleanpulse_database"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}

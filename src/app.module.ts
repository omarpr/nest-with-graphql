import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusDriver } from '@nestjs/mercurius';
import { HelloResolver } from './hello/hello.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksModule } from './tasks/tasks.module';
import { Task } from './tasks/entities/task.entity';

@Module({
  imports: [
    GraphQLModule.forRoot({
      driver: MercuriusDriver,
      autoSchemaFile: true,
      graphiql: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'omar',
      password: '',
      database: 'nest-with-graphql',
      entities: [Task],
      synchronize: true,
    }),
    TasksModule,
  ],
  controllers: [AppController],
  providers: [AppService, HelloResolver],
})
export class AppModule {}

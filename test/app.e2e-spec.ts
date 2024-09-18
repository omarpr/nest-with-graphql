import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { TasksService } from '../src/tasks/tasks.service';
import { TasksModule } from '../src/tasks/tasks.module';
import { Task } from '../src/tasks/entities/task.entity';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let tasksService: TasksService;

  const getLastTaskId = async () => {
    const tasks = await tasksService.findAll();
    const lastTask = tasks[tasks.length - 1];
    const { id } = lastTask;

    return id;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, TasksModule],
      providers: [TasksService],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    tasksService = moduleFixture.get<TasksService>(TasksService);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  describe('GraphQL', () => {
    it('hello should return "Hello World!"', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .send({ query: '{ hello }' })
        .expect(200)
        .expect({
          data: { hello: 'Hello World!' },
        });
    });

    describe('tasks', () => {
      it('calling the createTask mutation should return the created task', () => {
        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `mutation {
              createTask(createTaskInput: { title: "Test Task", description: "Test Description", completed: false }) {
                title
                description
                completed
              }
            }`,
          })
          .expect(200)
          .expect({
            data: {
              createTask: {
                title: 'Test Task',
                description: 'Test Description',
                completed: false,
              },
            },
          });
      });

      it('calling the tasks query should return an array of tasks', () => {
        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `{
              tasks {
                title
                description
                completed
              }
            }`,
          })
          .expect(200)
          .expect((res) => {
            const { body } = res;
            const tasks = body.data.tasks;

            expect(tasks).toBeInstanceOf(Array);
            expect(tasks.length).toBeGreaterThan(0);
            expect(tasks[tasks.length - 1]).toEqual({
              title: 'Test Task',
              description: 'Test Description',
              completed: false,
            });
          });
      });

      it('calling the completedTasks query should not return the created task', async () => {
        const id = await getLastTaskId();

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `{
              completedTasks {
                id
                title
                description
                completed
              }
            }`,
          })
          .expect(200)
          .expect((res) => {
            const { body } = res;
            const { completedTasks } = body.data;

            expect(completedTasks).toBeInstanceOf(Array);

            const task = completedTasks.find((task: Task) => task.id === id);
            expect(task).toBeUndefined();
          });
      });

      it('calling the updateTask mutation should return the updated task', async () => {
        const id = await getLastTaskId();

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `mutation {
              updateTask(id: ${id}, updateTaskInput: { title: "Updated Task", description: "Updated Description", completed: true }) {
                title
                description
                completed
              }
            }`,
          })
          .expect(200)
          .expect({
            data: {
              updateTask: {
                title: 'Updated Task',
                description: 'Updated Description',
                completed: true,
              },
            },
          });
      });

      it('calling the completedTasks query should return the updated task', async () => {
        const id = await getLastTaskId();

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `{
              completedTasks {
                id
                title
                description
                completed
              }
            }`,
          })
          .expect(200)
          .expect((res) => {
            const { body } = res;
            const { completedTasks } = body.data;

            expect(completedTasks).toBeInstanceOf(Array);

            const task = completedTasks.find((task: Task) => task.id === id);
            expect(task).toBeDefined();
            expect(task.completed).toBeTruthy();
          });
      });

      it('calling the deleteTask mutation should return the deleted task and we should have less tasks returned by the service', async () => {
        const id = await getLastTaskId();

        const tasksBefore = await tasksService.findAll();

        await request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `mutation {
              removeTask(id: ${id}) {
                title
                description
                completed
              }
            }`,
          })
          .expect(200)
          .expect({
            data: {
              removeTask: {
                title: 'Updated Task',
                description: 'Updated Description',
                completed: true,
              },
            },
          });

        const tasksAfter = await tasksService.findAll();

        // The number of tasks after the deletion should be less than the number of tasks before the deletion
        expect(tasksAfter.length).toBeLessThan(tasksBefore.length);
      });
    });
  });
});

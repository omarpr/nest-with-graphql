# nest-with-graphql

1. Make sure you are using the latest LTS version of Node.js
```
nvm list
nvm use lts/iron
```
2. Install Nest CLI
```
npm i -g @nestjs/cli
```
3. Create a new project
```
nest new nest-with-graphql
```
(For this examples, we will use npm)
4. Change directory
```
cd nest-with-graphql
```
5. Install the required dependencies
```
npm i @nestjs/platform-fastify
npm i @nestjs/typeorm typeorm pg
npm i @nestjs/graphql @nestjs/mercurius graphql mercurius
```
6. Open the project using your favorite editor
7. Make sure the IDE is using the correct version of Node.js
8. Change from Express to Fastify in `main.ts`, it will end up like this:
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );
  await app.listen(3000);
}
bootstrap();
```
9. Using your favorite terminal, run the project
```
npm run start:dev
```
10. Navigate to http://localhost:3000/
11. Make sure it shows `Hello World!`
12. Let's prepare the application for GraphQL
13. Open `src/app.module.ts` and add the following module to the imports:
```typescript
    GraphQLModule.forRoot<MercuriusDriverConfig>({
      driver: MercuriusDriver,
      autoSchemaFile: true,
      graphiql: true,
    }),
```
14. Our app will not run without at least one GraphQL resolver.
15. To create one, let's run this command:
```
nest g resolver
```
and name it `hello`
16. Open `src/hello/hello.resolver.ts` and add the following query:
```typescript
  @Query(() => String)
  hello(): string {
    return 'Hello World!';
  }
```
17. Now we can navigate to the playground (graphiql) by visiting http://localhost:3000/graphiql
18. Run the following query:
```graphql
{
  hello
}
```
19. You should see the response on the right
20. Congratulations! We have successfully created a NestJS application with GraphQL
21. Now, let's begin complicating things...
22. Let's get our app ready to connect to a database using TypeORM and Postgres
23. Go to `src/app.module.ts` and add the following imports:
```typescript
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'omar',
      password: '',
      database: 'nest-with-graphql',
      entities: [],
      synchronize: true,
    }),
```
24. The app will error out because can't find the database
25. Go to the console and create the database using the following command:
```
createdb nest-with-graphql
psql nest-with-graphql
```
26. Now, let's create a new resource called `tasks` and select `GraphQL (code first)` and generate the CRUD entry points
27. Run the following command:
```
nest g resource tasks
```
28. Notice in `src/app.module.ts` that the `TasksModule` is imported
29. Open `src/tasks/tasks.module.ts`. This will be our glue between the database and the GraphQL API
30. Open `src/tasks/tasks.resolver.ts` and notice the generated resolver with the CRUD operations
31. Open `src/tasks/entities/task.entity.ts` and notice the generated entity with an example field
32. Open `src/tasks/tasks.service.ts` and notice the generated service with the CRUD operations
33. Let's return some values on the `findAll` function.
```typescript
  findAll() {
    return [{ exampleField: 1 }, { exampleField: 2 }, { exampleField: 3 }];
  }
```
34. Now, let's run the following query on the playground (graphiql):
```graphql
{
  tasks {
    exampleField
  }
}
```
35. You should see the response on the right
36. Let's return a value on the `findOne` function.
```typescript
  findOne(id: number) {
    return {
      exampleField: id,
    };
  }
```
37. Now, let's run the following query on the playground (graphiql):
```graphql
{
  task(id: 1) {
    exampleField
  }
}
```
38. You should see the response on the right
39. Now we can begin create a task table in the database.
40. Open `src/tasks/entities/task.entity.ts` and set it to the following:
```typescript
@Entity('tasks')
@ObjectType()
export class Task {
  @PrimaryGeneratedColumn()
  @Field(() => Int)
  id: number;

  @Column()
  @Field()
  title: string;

  @Column()
  @Field()
  description: string;

  @Column()
  @Field()
  completed: boolean;
}
```
41. Go to the `AppModule` and add the `Task` entity to the entities array
```typescript
  entities: [Task],
```
42. Go to the `TasksModule` and add `TypeOrmModule` to the imports and exports
```typescript
  imports: [TypeOrmModule.forFeature([Task])],
  exports: [TypeOrmModule],
```
43. Now we are ready to make CRUD operations on the database table in the Tasks Resource
44. Let's start with the create operation
45. Open `src/tasks/dto/create-task.input.ts` and set it to the following:
```typescript
@InputType()
export class CreateTaskInput {
  @Field()
  title: string;

  @Field()
  description: string;

  @Field()
  completed: boolean;
}
```
46. Now let's prepare the `TasksResolver` to use TypeORM to do operations on the database
47. Open `src/tasks/tasks.resolver.ts` and set this to the constructor:
```typescript
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}
```
48. Now, let's implement the `findOne` and `create` function:
```typescript
  findOne(id: number) {
    return this.tasksRepository.findOne({
      where: {
        id,
      },
    });
  }
  
  ...

  async create(createTaskInput: CreateTaskInput) {
    const insertResult = await this.tasksRepository.insert(createTaskInput);
    const id = insertResult.identifiers[0].id;

    return await this.findOne(id);
  }
```
49. Now, let's run the following mutation on the playground (graphiql):
```graphql
mutation {
  createTask(
    createTaskInput: {
      title: "Dummy Task"
      description: "Lorem ipsum"
      completed: false
    }
  ) {
    id
    title
    description
    completed
  }
}
```
50. That should return the created task and you should see it on the right
51. We should also be able to run the following query on the playground (graphiql):
```graphql
{
  task(id: 1) {
    id
    title
    description
    completed
  }
}
```
52. That should return the task with the id 1 and you should see it on the right
53. Now, let's implemented the `findAll` function in the `TasksService`:
```typescript
  findAll() {
    return this.tasksRepository.find();
  }
```
54. Now, let's run the following query on the playground (graphiql):
```graphql
{
  tasks {
    id
    title
    description
    completed
  }
}
```
55. That should return all the tasks and you should see them on the right
56. Let's implement the `update` function in the `TasksService`, first of all, let's remove the `id` field from the `UpdateTaskInput` since we can't update the ID:
```typescript
  @Field(() => Int)
  id: number;
```
57. Let's modify the `updateTask` function in the `TasksResolver` to add the `id` argument, in the end, it should look like this:
```typescript
  @Mutation(() => Task)
  updateTask(
    @Args('id', { type: () => Int }) id: number,
    @Args('updateTaskInput') updateTaskInput: UpdateTaskInput,
  ) {
    return this.tasksService.update(id, updateTaskInput);
  }
```
58. Now, let's implement the `update` function in the `TasksService`:
```typescript
  async update(id: number, updateTaskInput: UpdateTaskInput) {
    const updateResult = await this.tasksRepository.update(id, updateTaskInput);

    if (updateResult.affected === 0) {
      throw new NotFoundException(`Task with ID "${id}" not found!`);
    }
    
    return await this.findOne(id);
  }
```
59. Now, let's run the following mutation on the playground (graphiql):
```graphql
mutation {
  updateTask(id: 1, updateTaskInput: {
    title: "Example Edit"
  }) {
    id
    title
    description
    completed
  }
}
```
60. That should return the updated task and you should see it on the right
61. Let's try querying for all the tasks again, we should see the updated task
62. Let's implement the `delete` function in the `TasksService`:
```typescript
  async remove(id: number) {
    const task = await this.findOne(id);

    if (!task) {
      throw new NotFoundException(`Task with ID "${id}" not found!`);
    }

    await this.tasksRepository.delete(id);

    return task;
  }
```
63. Now, let's run the following mutation on the playground (graphiql):
```graphql
mutation {
  removeTask(id: 5) {
    id
    title
    description
    completed
  }
}
```
64. That should return the deleted task and you should see it on the right, keep in mind that the deleted task is returned from the remove operation, this is a common pattern when doing GraphQL
65. Let's try querying for all the tasks again, we should not see the deleted task
66. Now, let's implement a query to get all the tasks that are completed
67. Open `src/tasks/tasks.resolver.ts` and add the following query:
```typescript
  @Query(() => [Task], { name: 'completedTasks' })
  findCompletedTasks() {
    return this.tasksService.findCompletedTasks();
  }
```
68. Now, let's implement the `findCompletedTasks` function in the `TasksService`:
```typescript
  findCompletedTasks() {
    return this.tasksRepository.find({
      where: {
        completed: true,
      },
    });
  }
```
69. Now, let's run the following query on the playground (graphiql):
```graphql
{
  completedTasks {
    id
    title
    description
    completed
  }
}
```
70. That should return all the tasks that are completed and you should see them on the right
71. But, notice there are none. Let's update one of the tasks to be completed
72. Let's run the following mutation on the playground (graphiql):
```graphql
mutation {
  updateTask(id: 1, updateTaskInput: {
    completed: true
  }) {
    id
    title
    description
    completed
  }
}
```
73. Now, let's query again for all the completed tasks
74. That should return the task that was updated to be completed and you should see it on the right
75. Finally, let's talk about what is a `ResolveField`. One of the most powerful features of GraphQL is the ability to resolve fields on the server dynamically depending on the user needs (defined in the query)
76. Let's implement a `ResolveField` and mock some data to return the assignees of a task
77. Create a new file in `src/tasks/entities/assignee.entity.ts` and set it to the following:
```typescript
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Assignee {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;
}
```
78. Now, let's update the `TasksResolver` to include the `assignees` resolved field:
```typescript
  @ResolveField(() => [Assignee])
  assignees(@Parent() task: Task) {
    return [
      {
        id: 1,
        name: 'John Doe',
      },
      {
        id: 2,
        name: 'Jane Doe',
      },
    ];
  }
```
79. Now, let's run the following query on the playground (graphiql):
```graphql
{
    completedTasks {
        id
        title
        description
        completed
        assignees {
            id
            name
        }
    }
}
```
80. That should return all the completed tasks with the assignees and you should see them on the right
81. Imagine the possibilities of `ResolveField` and how you can use it to resolve complex data structures
82. It would only query the database when the field is requested, not always as REST would do
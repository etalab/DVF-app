FROM python:3.9

RUN pip install Flask
RUN pip install pandas
RUN pip install SQLAlchemy
RUN pip install psycopg2-binary

VOLUME /home/dvfapp

WORKDIR /home/dvfapp

ENTRYPOINT ["python", "app.py"]